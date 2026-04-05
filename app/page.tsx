"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

type PageState = "landing" | "create" | "invoice" | "success";
type PlanId = "mini" | "cartoon-story" | "real-story" | "premium";

type FormState = {
  childName: string;
  childAge: string;
  companionName: string;
  wishes: string;
};

type Plan = {
  id: PlanId;
  title: string;
  duration: string;
  description: string;
  price: number;
};

export default function KidsAIVideoLanding() {
  const [page, setPage] = useState<PageState>("landing");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("mini");
  const [childFile, setChildFile] = useState<File | null>(null);
  const [companionFile, setCompanionFile] = useState<File | null>(null);
  const [childPreview, setChildPreview] = useState<string>("");
  const [companionPreview, setCompanionPreview] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");
  const [isCreatingPayment, setIsCreatingPayment] = useState<boolean>(false);
  const [form, setForm] = useState<FormState>({
    childName: "",
    childAge: "",
    companionName: "",
    wishes: "",
  });

  useEffect(() => {
    if (!childFile) {
      setChildPreview("");
      return;
    }
    const url = URL.createObjectURL(childFile);
    setChildPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [childFile]);

  useEffect(() => {
    if (!companionFile) {
      setCompanionPreview("");
      return;
    }
    const url = URL.createObjectURL(companionFile);
    setCompanionPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [companionFile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("paymentStatus");
    const returnedOrder = params.get("orderId");

    if (paymentStatus === "success") {
      setPage("success");
      if (returnedOrder) {
        setOrderNumber(returnedOrder);
      }
    }
  }, []);

  const ageOptions = Array.from({ length: 15 }, (_, index) => index + 1);

  const plans: Plan[] = [
    {
      id: "mini",
      title: "Мини-ролик",
      duration: "30–50 секунд",
      description: "Идеально для поздравления или подарка.",
      price: 2000,
    },
    {
      id: "cartoon-story",
      title: "Мульт-история",
      duration: "до 3 минут",
      description: "Персональный сюжет, несколько сцен.",
      price: 3990,
    },
    {
      id: "real-story",
      title: "Реалистичная сказочная история",
      duration: "до 3 минут",
      description: "Более кинематографичный и атмосферный формат.",
      price: 4990,
    },
    {
      id: "premium",
      title: "Премиум истории",
      duration: "до 5 минут",
      description:
        "Большая персональная история с расширенным сюжетом и более сильным вау-эффектом.",
      price: 7990,
    },
  ];

  const selectedPlanData =
    plans.find((plan) => plan.id === selectedPlan) || plans[0];

  const updateField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = () => {
    if (!childFile) return "Загрузите фото ребёнка.";
    if (!form.childName.trim()) return "Укажите имя ребёнка.";
    if (!form.childAge) return "Выберите возраст ребёнка.";
    if (!form.wishes.trim()) return "Напишите пожелания к видео.";
    return "";
  };

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();

    if (validationError) {
      setErrorText(validationError);
      return;
    }

    setErrorText("");
    setPage("invoice");
  };

  const handleCreatePayment = async () => {
    setErrorText("");
    setIsCreatingPayment(true);

    try {
      const payload = new FormData();
      payload.append("planId", selectedPlanData.id);
      payload.append("planTitle", selectedPlanData.title);
      payload.append("planDuration", selectedPlanData.duration);
      payload.append("childName", form.childName);
      payload.append("childAge", form.childAge);
      payload.append("companionName", form.companionName);
      payload.append("wishes", form.wishes);
      payload.append("amount", String(selectedPlanData.price));

      if (childFile) payload.append("childPhoto", childFile);
      if (companionFile) payload.append("companionPhoto", companionFile);

      const response = await fetch("/api/create-payment", {
        method: "POST",
        body: payload,
      });

      const rawText = await response.text();
      let data: {
        orderId?: string;
        confirmationUrl?: string;
        error?: string;
      } | null = null;

      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch {
        throw new Error(
          `Сервер вернул не JSON. Проверь /api/create-payment. Первые символы ответа: ${rawText.slice(
            0,
            120
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(data?.error || "Не удалось создать счёт на оплату.");
      }

      if (data?.orderId) {
        setOrderNumber(data.orderId);
      }

      if (!data?.confirmationUrl) {
        throw new Error("Ссылка на оплату не получена.");
      }

      window.location.href = data.confirmationUrl;
    } catch (error) {
      setErrorText(
        error instanceof Error
          ? error.message
          : "Ошибка при создании оплаты. Подключите backend и оплату."
      );
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const landingPage = (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.20),_transparent_30%),radial-gradient(circle_at_right,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_left,_rgba(34,197,94,0.10),_transparent_25%)]" />
      <div className="relative">
        <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">Magic Story</div>
            <div className="text-sm text-slate-300">
              Персональные AI-видео для детей
            </div>
          </div>
          <button
            onClick={() => setPage("create")}
            className="rounded-2xl bg-white text-slate-900 px-5 py-3 font-medium shadow-xl hover:scale-[1.02] transition"
          >
            Сделать видео
          </button>
        </header>

        <main className="max-w-6xl mx-auto px-6 pt-10 pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 mb-6">
                Видео с вашим ребёнком и его любимыми героями
              </div>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
                Создайте{" "}
                <span className="text-violet-300">волшебное AI-видео</span> с
                ребёнком
              </h1>
              <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-8">
                После нажатия на кнопку вы перейдёте на страницу создания, где
                сможете выбрать тариф, загрузить фото ребёнка, указать имя,
                возраст и по желанию добавить любимую игрушку или питомца.
              </p>
              <div className="mt-8">
                <button
                  onClick={() => setPage("create")}
                  className="rounded-2xl bg-violet-500 px-7 py-4 font-semibold shadow-2xl hover:scale-[1.02] transition"
                >
                  Сделать видео
                </button>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <div className="rounded-[28px] border border-white/10 bg-slate-900/60 p-6">
                <div className="text-sm text-slate-400">Что будет дальше</div>
                <div className="mt-6 grid gap-4 text-slate-200">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    1. Выбор подходящего тарифа
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    2. Фото ребёнка
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    3. Имя ребёнка
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    4. Возраст ребёнка
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    5. Фото питомца или игрушки (необезательно)
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    6. Имя питомца или игрушки (необезательно)
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                    7. Пожелания к видео
                  </div>
                  <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 px-5 py-4">
                    8. Счёт на оплату через ЮKassa
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );

  const createPage = (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.20),_transparent_30%),radial-gradient(circle_at_right,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_left,_rgba(34,197,94,0.10),_transparent_25%)]" />
      <div className="relative">
        <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-bold tracking-tight">Magic Story</div>
            <div className="text-sm text-slate-300">Создание видео</div>
          </div>
          <button
            onClick={() => setPage("landing")}
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium hover:bg-white/10 transition"
          >
            ← Назад
          </button>
        </header>

        <main className="max-w-5xl mx-auto px-6 pb-20">
          <section className="pt-6 pb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 mb-6">
              Заполните данные для видео
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Создайте персональное видео для ребёнка
            </h1>
            <p className="mt-5 max-w-3xl text-lg text-slate-300 leading-8">
              Выберите тариф, загрузите фотографию ребёнка и по желанию
              добавьте питомца или игрушку, которые должны появиться в истории.
            </p>
          </section>

          <form onSubmit={handleContinue} className="grid gap-8">
            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                1. Выбор тарифа
              </div>
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                {plans.map((plan) => {
                  const active = selectedPlan === plan.id;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`text-left rounded-[28px] border p-6 transition ${
                        active
                          ? "border-violet-300/40 bg-violet-500/12"
                          : "border-white/10 bg-slate-900/50 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-semibold">
                            {plan.title}
                          </h2>
                          <div className="mt-2 text-sm text-violet-200">
                            {plan.duration}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-white whitespace-nowrap">
                          {plan.price} ₽
                        </div>
                      </div>
                      <p className="mt-4 text-slate-300 leading-8">
                        {plan.description}
                      </p>
                      <div className="mt-4 text-slate-200 leading-7">
                        Каждая история создаётся индивидуально под вашего
                        ребёнка.
                      </div>
                      <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-violet-200">
                        <span
                          className={`h-3 w-3 rounded-full ${
                            active ? "bg-violet-300" : "bg-slate-500"
                          }`}
                        />
                        {active ? "Выбрано" : "Нажмите, чтобы выбрать"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                2. Фото ребёнка
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                Загрузите фото ребёнка в полный рост и в любимой одежде
              </h2>
              <p className="mt-3 text-slate-300 leading-7">
                Чем лучше видно ребёнка на фото, тем точнее и красивее
                получится образ в видео.
              </p>
              <label className="mt-6 block rounded-[28px] border border-dashed border-white/15 bg-slate-900/50 p-6 cursor-pointer hover:bg-white/5 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setChildFile(event.target.files?.[0] || null)
                  }
                  className="hidden"
                />
                <div className="text-base font-medium">
                  Нажмите, чтобы загрузить фото ребёнка
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  PNG, JPG, WEBP
                </div>
              </label>
              {childPreview && (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-900/50 p-4">
                  <img
                    src={childPreview}
                    alt="Фото ребёнка"
                    className="w-full max-h-[420px] object-contain rounded-[24px]"
                  />
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                3. Имя ребёнка
              </div>
              <label className="block text-lg font-semibold mt-4 mb-3">
                Имя ребёнка
              </label>
              <input
                type="text"
                value={form.childName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("childName", event.target.value)
                }
                placeholder="Например: София"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-white placeholder:text-slate-500 outline-none focus:border-violet-300/40"
              />
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                4. Возраст ребёнка
              </div>
              <label className="block text-lg font-semibold mt-4 mb-3">
                Возраст ребёнка
              </label>
              <select
                value={form.childAge}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  updateField("childAge", event.target.value)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-white outline-none focus:border-violet-300/40"
              >
                <option value="">Выберите возраст</option>
                {ageOptions.map((age) => (
                  <option key={age} value={age}>
                    {age} {age === 1 ? "год" : age < 5 ? "года" : "лет"}
                  </option>
                ))}
              </select>
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                5. Фото питомца или игрушки (необезательно)
              </div>
              <h2 className="mt-2 text-2xl font-semibold">
                Загрузите фото питомца или игрушки, если хотите добавить его в
                видео
              </h2>
              <p className="mt-3 text-slate-300 leading-7">
                Этот шаг необязательный. Если у ребёнка есть любимая игрушка или
                питомец, вы можете добавить его в историю.
              </p>
              <label className="mt-6 block rounded-[28px] border border-dashed border-white/15 bg-slate-900/50 p-6 cursor-pointer hover:bg-white/5 transition">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setCompanionFile(event.target.files?.[0] || null)
                  }
                  className="hidden"
                />
                <div className="text-base font-medium">
                  Нажмите, чтобы загрузить фото питомца или игрушки
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  PNG, JPG, WEBP
                </div>
              </label>
              {companionPreview && (
                <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-900/50 p-4">
                  <img
                    src={companionPreview}
                    alt="Фото питомца или игрушки"
                    className="w-full max-h-[420px] object-contain rounded-[24px]"
                  />
                </div>
              )}
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                6. Имя питомца или игрушки (необезательно)
              </div>
              <label className="block text-lg font-semibold mt-4 mb-3">
                Имя питомца или игрушки (необезательно)
              </label>
              <input
                type="text"
                value={form.companionName}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("companionName", event.target.value)
                }
                placeholder="Например: Барсик или Мистер Бобо"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-white placeholder:text-slate-500 outline-none focus:border-violet-300/40"
              />
            </section>

            <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
                7. Пожелания к видео
              </div>
              <label className="block text-lg font-semibold mt-4 mb-3">
                Напишите, что вы хотите увидеть в этом видео с вашим ребёнком
              </label>
              <textarea
                value={form.wishes}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  updateField("wishes", event.target.value)
                }
                placeholder="Например: хочу доброе видео, где ребёнок путешествует по космосу и находит волшебную планету."
                className="w-full min-h-[180px] rounded-[24px] border border-white/10 bg-slate-900/60 px-4 py-4 text-white placeholder:text-slate-500 outline-none focus:border-violet-300/40 resize-none"
              />
            </section>

            {errorText && (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-5 py-4 text-rose-100">
                {errorText}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pb-8">
              <button
                type="submit"
                className="rounded-2xl bg-white text-slate-900 px-7 py-4 font-semibold hover:scale-[1.02] transition"
              >
                Продолжить
              </button>
              <button
                type="button"
                onClick={() => setPage("landing")}
                className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-semibold hover:bg-white/10 transition"
              >
                Вернуться на главную
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );

  const invoicePage = (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.20),_transparent_30%),radial-gradient(circle_at_right,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_left,_rgba(34,197,94,0.10),_transparent_25%)]" />
      <div className="relative max-w-5xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between gap-4 pb-8">
          <div>
            <div className="text-2xl font-bold tracking-tight">Magic Story</div>
            <div className="text-sm text-slate-300">Счёт на оплату</div>
          </div>
          <button
            onClick={() => setPage("create")}
            className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium hover:bg-white/10 transition"
          >
            ← Назад к форме
          </button>
        </header>

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-7 md:p-8">
            <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
              Ваш заказ
            </div>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight">
              Проверьте данные перед оплатой
            </h1>

            <div className="mt-8 grid gap-4 text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4">
                Тариф: {selectedPlanData.title}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4">
                Длительность: {selectedPlanData.duration}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4">
                Имя ребёнка: {form.childName}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4">
                Возраст ребёнка: {form.childAge}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/50 px-5 py-4">
                Имя питомца / игрушки: {form.companionName || "не указано"}
              </div>
              <div className="rounded-[24px] border border-white/10 bg-slate-900/50 px-5 py-4">
                <div className="font-medium">Пожелания к видео</div>
                <div className="mt-2 text-slate-300 whitespace-pre-wrap">
                  {form.wishes}
                </div>
              </div>
            </div>

            <div className="mt-8 grid md:grid-cols-2 gap-4">
              <div className="rounded-[24px] border border-white/10 bg-slate-900/50 p-4">
                <div className="text-sm text-slate-400 mb-3">Фото ребёнка</div>
                {childPreview ? (
                  <img
                    src={childPreview}
                    alt="Фото ребёнка"
                    className="w-full h-56 object-contain rounded-[18px] bg-black/20"
                  />
                ) : (
                  <div className="h-56 rounded-[18px] bg-white/5" />
                )}
              </div>
              <div className="rounded-[24px] border border-white/10 bg-slate-900/50 p-4">
                <div className="text-sm text-slate-400 mb-3">
                  Фото питомца или игрушки
                </div>
                {companionPreview ? (
                  <img
                    src={companionPreview}
                    alt="Фото питомца или игрушки"
                    className="w-full h-56 object-contain rounded-[18px] bg-black/20"
                  />
                ) : (
                  <div className="h-56 rounded-[18px] bg-white/5 flex items-center justify-center text-slate-500 text-sm">
                    Не добавлено
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-violet-300/20 bg-violet-500/10 p-7 md:p-8 h-fit">
            <div className="text-sm uppercase tracking-[0.24em] text-violet-200/80">
              Оплата
            </div>
            <h2 className="mt-2 text-2xl font-semibold">Счёт через ЮKassa</h2>

            <div className="mt-8 rounded-[24px] border border-white/10 bg-slate-950/60 p-6">
              <div className="text-sm text-slate-400">Итого к оплате</div>
              <div className="mt-2 text-5xl font-bold tracking-tight">
                {selectedPlanData.price} ₽
              </div>
              <div className="mt-3 text-slate-300 leading-7">
                После нажатия кнопки создаётся платёж, и пользователь переходит
                на защищённую страницу оплаты.
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-900/50 p-5 text-slate-300 leading-7">
              После успешной оплаты ваш заказ сразу поступает в работу. Мы используем ваши фотографии, имя ребёнка, возраст и пожелания, чтобы создать персональное видео.
            </div>

            {errorText && (
              <div className="mt-5 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-4 text-rose-100">
                {errorText}
              </div>
            )}

            <button
              onClick={handleCreatePayment}
              disabled={isCreatingPayment}
              className="mt-6 w-full rounded-2xl bg-white text-slate-900 px-7 py-4 font-semibold hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100"
            >
              {isCreatingPayment ? "Создаём счёт..." : "Оплатить через ЮKassa"}
            </button>

            <button
              onClick={() => setPage("create")}
              className="mt-4 w-full rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-semibold hover:bg-white/10 transition"
            >
              Изменить данные
            </button>
          </aside>
        </div>
      </div>
    </div>
  );

  const successPage = (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.20),_transparent_30%),radial-gradient(circle_at_right,_rgba(59,130,246,0.14),_transparent_30%),radial-gradient(circle_at_left,_rgba(34,197,94,0.10),_transparent_25%)]" />
      <div className="relative max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-[36px] border border-white/10 bg-white/5 p-10 md:p-14 shadow-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
            Оплата прошла успешно
          </div>
          <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight">
            Спасибо, заказ оплачен
          </h1>
          <p className="mt-5 text-lg text-slate-300 leading-8 max-w-2xl mx-auto">
  После подтверждения оплаты данные заказа будут отправлены владельцу сайта автоматически.
</p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setPage("landing")}
              className="rounded-2xl bg-white text-slate-900 px-7 py-4 font-semibold hover:scale-[1.02] transition"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (page === "create") return createPage;
  if (page === "invoice") return invoicePage;
  if (page === "success") return successPage;

  return landingPage;
}