/**
 * useTrainingEnrollment
 * Runs the whole enrollment flow for a training:
 *   1. Submit the enrollment and receive the Stripe clientSecret
 *   2. Mount the Stripe Payment Element (MB WAY, Multibanco, Apple Pay, card)
 *   3. Track the UI state: idle → submitting → awaiting_payment → success | error
 * The available dates come from the page, which loads them on the server.
 */

import type { Stripe, StripeElements } from "@stripe/stripe-js";
// The pure entry loads Stripe.js only when loadStripe() runs. The default one
// injects it on import, and the site-wide links that prefetch the training
// page would then pull it, fraud-detection frames included, into every page.
import { loadStripe } from "@stripe/stripe-js/pure";

export type PaymentState =
  | "idle"
  | "submitting"
  | "awaiting_payment"
  | "confirming"
  | "success"
  | "error";

export interface TrainingData {
  documentId: string;
  start_date: string;
  end_date: string | null;
  location: string;
  location_url: string | null;
  stock_left: number;
  stock: number;
  active: boolean;
}

export interface EnrollmentForm {
  name: string;
  email: string;
  phone: string;
  birthday: string;
  nif: string;
  trainingDocumentId: string;
  participated_workshop: boolean | null;
  has_exposure: boolean | null;
  bought_bitcoin: boolean | null;
  has_self_custody: boolean | null;
  expectations: string;
}

export default function useTrainingEnrollment() {
  const config = useRuntimeConfig();
  const stripePublishableKey = String(config.public.stripePublishableKey ?? "");
  const appLocale = useAppLocale();

  // Error messages in the page's language
  const message = (pt: string, en: string) =>
    appLocale.value === "pt" ? pt : en;

  // ── State ─────────────────────────────────────────────────────────────────
  const paymentState = ref<PaymentState>("idle");
  const clientSecret = ref<string>("");
  const errorMessage = ref<string>("");

  // Stripe instances
  let stripePromise: Promise<Stripe | null> | null = null;
  let stripeInstance: Stripe | null = null;
  let elementsInstance: StripeElements | null = null;

  // ── Initialise Stripe ─────────────────────────────────────────────────────
  async function loadStripeInstance(): Promise<Stripe | null> {
    try {
      stripeInstance = await loadStripe(stripePublishableKey);
      return stripeInstance;
    } catch (error) {
      stripePromise = null;
      throw error;
    }
  }

  // One load, shared by the preload and the payment step. A failed load is
  // forgotten, so the next call tries again.
  function initStripe(): Promise<Stripe | null> {
    stripePromise ??= loadStripeInstance();
    return stripePromise;
  }

  // Called once the visitor starts filling in the form, so Stripe.js is ready
  // by the payment step without weighing on visitors who only read the page.
  function preloadStripe() {
    initStripe().catch(() => {
      // The payment step loads it again and reports the failure there.
    });
  }

  // ── Submit the enrollment (step 1: create the record + PaymentIntent) ─────
  // Returns the price the server settled on (the amount that will be charged).
  async function submitEnrollment(
    form: EnrollmentForm,
    memberToken?: string
  ): Promise<{ memberLayer?: 1 | 2; priceEur: number } | undefined> {
    paymentState.value = "submitting";
    errorMessage.value = "";

    try {
      const response = await $fetch<{
        clientSecret: string;
        devMode: boolean;
        memberLayer?: 1 | 2;
        orderId: string;
        priceEur: number;
      }>("/api/enrollments", {
        body: {
          birthday: form.birthday,
          bought_bitcoin: form.bought_bitcoin,
          email: form.email,
          expectations: form.expectations || undefined,
          has_exposure: form.has_exposure,
          has_self_custody: form.has_self_custody,
          memberToken: memberToken || undefined,
          name: form.name,
          nif: form.nif || undefined,
          participated_workshop: form.participated_workshop,
          phone: form.phone.replace(/\s/g, ""),
          trainingId: form.trainingDocumentId,
        },
        method: "POST",
      });

      const price = {
        memberLayer: response.memberLayer,
        priceEur: response.priceEur,
      };

      // Dev mode: the backend confirms the payment on its own
      if (response.devMode) {
        paymentState.value = "success";
        return price;
      }

      clientSecret.value = response.clientSecret;
      paymentState.value = "awaiting_payment";
      return price;
    } catch (error: unknown) {
      paymentState.value = "error";
      errorMessage.value =
        fetchErrorNestedMessage(error) ??
        message(
          "Ocorreu um erro. Por favor tente novamente.",
          "Something went wrong. Please try again."
        );
      return undefined;
    }
  }

  // ── Mount the Stripe Payment Element into a DOM container ─────────────────
  async function mountPaymentElement(containerId: string, stripeLocale = "pt") {
    // A blocked or failed script load ends in the error state, not a payment
    // step that never appears.
    const stripe = await initStripe().catch(() => null);
    if (!stripe || !clientSecret.value) {
      errorMessage.value = message(
        "Erro ao inicializar o sistema de pagamento.",
        "Could not start the payment system."
      );
      paymentState.value = "error";
      return;
    }

    // The site's field colours and corners (.field-box), so the payment step
    // reads as part of the same form.
    elementsInstance = stripe.elements({
      appearance: {
        theme: "stripe",
        variables: {
          borderRadius: "8px",
          colorBackground: "#ffffff",
          colorDanger: "#b91c1c",
          colorPrimary: "#0a0a0a",
          colorText: "#0a0a0a",
          fontFamily: "Inter, system-ui, sans-serif",
        },
      },
      clientSecret: clientSecret.value,
      locale: stripeLocale === "pt" ? "pt" : "en",
    });

    const paymentElement = elementsInstance.create("payment", {
      layout: "tabs",
    });

    paymentElement.mount(`#${containerId}`);
  }

  // ── Confirm the payment (step 2: the user presses "Pay") ──────────────────
  async function confirmPayment(returnUrl: string) {
    if (!stripeInstance || !elementsInstance) {
      errorMessage.value = message(
        "Sistema de pagamento não inicializado.",
        "The payment system is not ready."
      );
      paymentState.value = "error";
      return;
    }

    paymentState.value = "confirming";

    const { error } = await stripeInstance.confirmPayment({
      elements: elementsInstance,
      confirmParams: {
        return_url: returnUrl,
      },
      // Only redirect for the methods that cannot complete inline
      redirect: "if_required",
    });

    if (error) {
      paymentState.value = "error";
      errorMessage.value =
        error.message ??
        message(
          "O pagamento falhou. Por favor tente novamente.",
          "The payment failed. Please try again."
        );
    } else {
      // Confirmed inline (e.g. Apple Pay, card 3DS without a redirect).
      // MB WAY and Multibanco redirect instead; their outcome arrives by webhook.
      paymentState.value = "success";
    }
  }

  /**
   * Checks whether Stripe sent the user back here after a payment.
   * Called from the component's onMounted to catch MB WAY/Multibanco redirects.
   */
  function checkRedirectResult() {
    if (!import.meta.client) {
      return;
    }

    const url = new URL(window.location.href);
    const redirectStatus = url.searchParams.get("redirect_status");
    const paymentIntentParam = url.searchParams.get("payment_intent");

    if (!redirectStatus || !paymentIntentParam) {
      return;
    }

    // Drop Stripe's query params without a reload. Vue Router keeps the
    // current path in the history state and writes it back on the next
    // navigation, so the state gets the clean path as well.
    url.searchParams.delete("redirect_status");
    url.searchParams.delete("payment_intent");
    url.searchParams.delete("payment_intent_client_secret");
    const cleanPath = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(
      { ...window.history.state, current: cleanPath },
      "",
      cleanPath
    );

    if (redirectStatus === "succeeded") {
      paymentState.value = "success";
    } else if (redirectStatus === "processing") {
      // MB WAY/Multibanco still processing — the webhook confirms it later
      paymentState.value = "success";
    } else {
      paymentState.value = "error";
      errorMessage.value = message(
        "O pagamento falhou. Por favor tente novamente.",
        "The payment failed. Please try again."
      );
    }
  }

  function reset() {
    paymentState.value = "idle";
    clientSecret.value = "";
    errorMessage.value = "";
    elementsInstance = null;
  }

  return {
    checkRedirectResult,
    clientSecret,
    confirmPayment,
    errorMessage,
    mountPaymentElement,
    paymentState,
    preloadStripe,
    reset,
    submitEnrollment,
  };
}
