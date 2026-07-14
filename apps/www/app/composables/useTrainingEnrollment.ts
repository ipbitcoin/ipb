/**
 * useTrainingEnrollment
 * Composable que gere o fluxo completo de inscrição numa formação:
 *   1. Buscar trainings disponíveis do Convex
 *   2. Submeter enrollment e receber o clientSecret do Stripe
 *   3. Montar o Payment Element do Stripe (suporta MBWay, Multibanco, Apple Pay, card)
 *   4. Gerir estados de UI: idle → submitting → awaiting_payment → success | error
 */

import { api } from "@ipb/backend/api";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe, StripeElements } from "@stripe/stripe-js";

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
  const convex = useConvex();
  const appLocale = useAppLocale();

  // ── Estado ────────────────────────────────────────────────────────────────
  const paymentState = ref<PaymentState>("idle");
  const clientSecret = ref<string>("");
  const errorMessage = ref<string>("");
  const trainings = ref<TrainingData[]>([]);
  const trainingsLoading = ref(false);
  const trainingsError = ref(false);

  // Stripe instances
  let stripeInstance: Stripe | null = null;
  let elementsInstance: StripeElements | null = null;

  // ── Buscar trainings disponíveis ──────────────────────────────────────────
  async function fetchTrainings() {
    trainingsLoading.value = true;
    trainingsError.value = false;
    try {
      trainings.value = await convex.query(api.trainings.listActive, {
        locale: appLocale.value,
      });
    } catch (error) {
      console.error("[useTrainingEnrollment] Erro ao buscar trainings:", error);
      trainingsError.value = true;
      trainings.value = [];
    } finally {
      trainingsLoading.value = false;
    }
  }

  // ── Inicializar Stripe ────────────────────────────────────────────────────
  async function initStripe(): Promise<Stripe | null> {
    if (stripeInstance) {
      return stripeInstance;
    }
    stripeInstance = await loadStripe(stripePublishableKey);
    return stripeInstance;
  }

  // ── Submeter enrollment (passo 1: criar registo + PaymentIntent) ──────────
  async function submitEnrollment(form: EnrollmentForm) {
    paymentState.value = "submitting";
    errorMessage.value = "";

    try {
      const response = await $fetch<{
        clientSecret: string;
        orderId: string;
        devMode: boolean;
      }>("/api/enrollments", {
        body: {
          birthday: form.birthday,
          bought_bitcoin: form.bought_bitcoin,
          email: form.email,
          expectations: form.expectations || undefined,
          has_exposure: form.has_exposure,
          has_self_custody: form.has_self_custody,
          name: form.name,
          nif: form.nif || undefined,
          participated_workshop: form.participated_workshop,
          phone: form.phone.replace(/\s/g, ""),
          trainingId: form.trainingDocumentId,
        },
        method: "POST",
      });

      // Modo DEV: pagamento auto-confirmado no backend
      if (response.devMode) {
        paymentState.value = "success";
        return;
      }

      clientSecret.value = response.clientSecret;
      paymentState.value = "awaiting_payment";
    } catch (error: unknown) {
      paymentState.value = "error";
      errorMessage.value =
        fetchErrorNestedMessage(error) ??
        "Ocorreu um erro. Por favor tente novamente.";
    }
  }

  // ── Montar o Payment Element do Stripe num container DOM ──────────────────
  async function mountPaymentElement(containerId: string, stripeLocale = "pt") {
    const stripe = await initStripe();
    if (!stripe || !clientSecret.value) {
      errorMessage.value = "Erro ao inicializar o sistema de pagamento.";
      paymentState.value = "error";
      return;
    }

    elementsInstance = stripe.elements({
      appearance: {
        theme: "stripe",
        variables: {
          borderRadius: "3px",
          colorBackground: "#ffffff",
          colorPrimary: "#000000",
          colorText: "#111111",
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

  // ── Confirmar pagamento (passo 2: o utilizador clica "Pagar") ─────────────
  async function confirmPayment(returnUrl: string) {
    if (!stripeInstance || !elementsInstance) {
      errorMessage.value = "Sistema de pagamento não inicializado.";
      paymentState.value = "error";
      return;
    }

    paymentState.value = "confirming";

    const { error } = await stripeInstance.confirmPayment({
      elements: elementsInstance,
      confirmParams: {
        return_url: returnUrl,
      },
      // Não redirecionar automaticamente para métodos que completam inline
      redirect: "if_required",
    });

    if (error) {
      paymentState.value = "error";
      errorMessage.value =
        error.message ?? "O pagamento falhou. Por favor tente novamente.";
    } else {
      // O pagamento foi confirmado inline (ex: Apple Pay, card 3DS sem redirect)
      // Para MBWay e Multibanco, o Stripe redireciona — o estado final vem via webhook.
      paymentState.value = "success";
    }
  }

  /**
   * Verifica se o utilizador foi redirecionado de volta pelo Stripe após um pagamento.
   * Chamado no onMounted do componente para detetar redirects de MBWay/Multibanco.
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

    // Limpar os query params do URL sem recarregar a página
    url.searchParams.delete("redirect_status");
    url.searchParams.delete("payment_intent");
    url.searchParams.delete("payment_intent_client_secret");
    window.history.replaceState({}, "", url.toString());

    if (redirectStatus === "succeeded") {
      paymentState.value = "success";
    } else if (redirectStatus === "processing") {
      // MBWay/Multibanco ainda em processamento — o webhook confirmará mais tarde
      paymentState.value = "success";
    } else {
      paymentState.value = "error";
      errorMessage.value = "O pagamento falhou. Por favor tente novamente.";
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
    fetchTrainings,
    mountPaymentElement,
    paymentState,
    reset,
    submitEnrollment,
    trainings,
    trainingsError,
    trainingsLoading,
  };
}
