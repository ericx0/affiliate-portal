/* One-off script: sync affiliate-portal locale messages after the
   dashboard/agent API-drift fixes. Adds new keys, removes dead ones. */
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "../src/i18n/messages");

const DASHBOARD_REMOVE = [
  "statInvites", "statOrders", "statWithdrawable", "withdraw",
  "withdrawModalTitle", "withdrawBalance", "withdrawAmountLabel",
  "withdrawMethodLabel", "methodPaypal", "methodWire", "methodWise",
  "withdrawDetailsLabel", "ppPaypalPlaceholder", "ppBankPlaceholder",
  "submitWithdraw", "invalidAmount", "withdrawSubmitted", "submitFailed",
  "assetLibrary", "assetBadge", "assetTitle", "assetDesc", "openDrive",
  "thStatus", "statusPaid", "statusPending",
];

const NEW = {
  en: {
    dashboard: {
      overviewSubtitle: "Real-time view of your referral traffic, earnings, and payouts",
      statClicks: "Total Clicks",
      statActiveCodes: "Active Codes",
      statSettleable: "Settleable Balance",
      autoPayoutTitle: "Automatic Monthly Payout",
      autoPayoutDesc: "Commissions are paid automatically via Stripe Connect on the 14th of each month. Balances below the $50 minimum roll over to the next month.",
      nextSettlementLabel: "Next settlement date",
      minThresholdLabel: "Minimum payout",
      settleableBalanceLabel: "Current settleable balance",
      setupStripeCta: "Connect Stripe to receive payouts",
      submitTaxCta: "Submit your tax form",
      pendingTitle: "Account Under Review",
      pendingDesc: "Your affiliate account is pending admin approval. Once approved, you can create referral codes and start earning. In the meantime, you can set up Stripe Connect and submit your tax form.",
      pendingStripeCta: "Set up Stripe Connect",
      pendingTaxCta: "Submit tax form",
      noCodeYet: "No referral code yet",
      createCodeCta: "Create a code",
    },
    codes: {
      pendingNotice: "Your account is under review. You can create referral codes once it is approved.",
    },
    agent: {
      inviteUnavailable: "Invite link unavailable",
    },
  },
  zh: {
    dashboard: {
      overviewSubtitle: "实时查看你的推广点击、收益与结算情况",
      statClicks: "总点击量",
      statActiveCodes: "有效推广码",
      statSettleable: "可结算余额",
      autoPayoutTitle: "每月自动结算",
      autoPayoutDesc: "佣金将于每月 14 日通过 Stripe Connect 自动打款。余额不足 50 美元最低门槛时自动结转至次月。",
      nextSettlementLabel: "下次结算日",
      minThresholdLabel: "最低结算金额",
      settleableBalanceLabel: "当前可结算余额",
      setupStripeCta: "绑定 Stripe 以接收打款",
      submitTaxCta: "提交税务表单",
      pendingTitle: "账号审核中",
      pendingDesc: "你的联盟账号正在等待管理员审核。审核通过后即可创建推广码并开始赚取佣金。等待期间可以先完成 Stripe Connect 入驻并提交税务表单。",
      pendingStripeCta: "设置 Stripe Connect",
      pendingTaxCta: "提交税务表单",
      noCodeYet: "还没有推广码",
      createCodeCta: "去创建推广码",
    },
    codes: {
      pendingNotice: "账号正在审核中，审核通过后才能创建推广码。",
    },
    agent: {
      inviteUnavailable: "邀请链接暂不可用",
    },
  },
  es: {
    dashboard: {
      overviewSubtitle: "Vista en tiempo real de tu tráfico de referidos, ganancias y pagos",
      statClicks: "Clics totales",
      statActiveCodes: "Códigos activos",
      statSettleable: "Saldo liquidable",
      autoPayoutTitle: "Pago mensual automático",
      autoPayoutDesc: "Las comisiones se pagan automáticamente a través de Stripe Connect el día 14 de cada mes. Los saldos por debajo del mínimo de $50 se acumulan para el mes siguiente.",
      nextSettlementLabel: "Próxima fecha de liquidación",
      minThresholdLabel: "Pago mínimo",
      settleableBalanceLabel: "Saldo liquidable actual",
      setupStripeCta: "Conecta Stripe para recibir pagos",
      submitTaxCta: "Envía tu formulario fiscal",
      pendingTitle: "Cuenta en revisión",
      pendingDesc: "Tu cuenta de afiliado está pendiente de aprobación. Una vez aprobada, podrás crear códigos de referido y empezar a ganar. Mientras tanto, puedes configurar Stripe Connect y enviar tu formulario fiscal.",
      pendingStripeCta: "Configurar Stripe Connect",
      pendingTaxCta: "Enviar formulario fiscal",
      noCodeYet: "Aún no tienes código de referido",
      createCodeCta: "Crear un código",
    },
    codes: {
      pendingNotice: "Tu cuenta está en revisión. Podrás crear códigos de referido cuando sea aprobada.",
    },
    agent: {
      inviteUnavailable: "Enlace de invitación no disponible",
    },
  },
  ru: {
    dashboard: {
      overviewSubtitle: "Клики по реферальным ссылкам, доход и выплаты в реальном времени",
      statClicks: "Всего кликов",
      statActiveCodes: "Активные коды",
      statSettleable: "Доступно к выплате",
      autoPayoutTitle: "Автоматическая ежемесячная выплата",
      autoPayoutDesc: "Комиссии автоматически выплачиваются через Stripe Connect 14-го числа каждого месяца. Суммы ниже минимального порога $50 переносятся на следующий месяц.",
      nextSettlementLabel: "Дата следующей выплаты",
      minThresholdLabel: "Минимальная выплата",
      settleableBalanceLabel: "Текущий доступный баланс",
      setupStripeCta: "Подключите Stripe для получения выплат",
      submitTaxCta: "Отправьте налоговую форму",
      pendingTitle: "Аккаунт на проверке",
      pendingDesc: "Ваш партнёрский аккаунт ожидает одобрения администратора. После одобрения вы сможете создавать реферальные коды и зарабатывать. А пока можно настроить Stripe Connect и отправить налоговую форму.",
      pendingStripeCta: "Настроить Stripe Connect",
      pendingTaxCta: "Отправить налоговую форму",
      noCodeYet: "Реферального кода пока нет",
      createCodeCta: "Создать код",
    },
    codes: {
      pendingNotice: "Ваш аккаунт на проверке. Создавать реферальные коды можно будет после одобрения.",
    },
    agent: {
      inviteUnavailable: "Ссылка-приглашение недоступна",
    },
  },
  ar: {
    dashboard: {
      overviewSubtitle: "عرض مباشر لنقرات الإحالة والأرباح والمدفوعات",
      statClicks: "إجمالي النقرات",
      statActiveCodes: "الرموز النشطة",
      statSettleable: "الرصيد القابل للتسوية",
      autoPayoutTitle: "دفع شهري تلقائي",
      autoPayoutDesc: "تُدفع العمولات تلقائيًا عبر Stripe Connect في اليوم 14 من كل شهر. الأرصدة التي تقل عن الحد الأدنى 50 دولارًا تُرحَّل إلى الشهر التالي.",
      nextSettlementLabel: "تاريخ التسوية القادم",
      minThresholdLabel: "الحد الأدنى للدفع",
      settleableBalanceLabel: "الرصيد الحالي القابل للتسوية",
      setupStripeCta: "اربط Stripe لاستلام المدفوعات",
      submitTaxCta: "أرسل النموذج الضريبي",
      pendingTitle: "الحساب قيد المراجعة",
      pendingDesc: "حساب الشريك الخاص بك في انتظار موافقة المسؤول. بعد الموافقة يمكنك إنشاء رموز الإحالة والبدء في الربح. في هذه الأثناء يمكنك إعداد Stripe Connect وإرسال النموذج الضريبي.",
      pendingStripeCta: "إعداد Stripe Connect",
      pendingTaxCta: "إرسال النموذج الضريبي",
      noCodeYet: "لا يوجد رمز إحالة بعد",
      createCodeCta: "إنشاء رمز",
    },
    codes: {
      pendingNotice: "حسابك قيد المراجعة. يمكنك إنشاء رموز الإحالة بعد الموافقة.",
    },
    agent: {
      inviteUnavailable: "رابط الدعوة غير متاح",
    },
  },
};

for (const locale of Object.keys(NEW)) {
  const file = path.join(dir, `${locale}.json`);
  const msgs = JSON.parse(fs.readFileSync(file, "utf8"));

  // Remove dead dashboard keys and the whole admin section (admin pages removed).
  for (const k of DASHBOARD_REMOVE) delete msgs.dashboard?.[k];
  delete msgs.admin;

  // Add new keys.
  for (const [section, kv] of Object.entries(NEW[locale])) {
    msgs[section] = { ...(msgs[section] || {}), ...kv };
  }

  fs.writeFileSync(file, JSON.stringify(msgs, null, 2) + "\n");
  console.log(`updated ${locale}.json`);
}

// Sanity: all locales must have identical key structure.
const shape = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? shape(v, `${p}${k}.`) : [`${p}${k}`],
  ).sort();
const ref = shape(JSON.parse(fs.readFileSync(path.join(dir, "en.json"), "utf8")));
for (const locale of ["zh", "es", "ru", "ar"]) {
  const keys = shape(JSON.parse(fs.readFileSync(path.join(dir, `${locale}.json`), "utf8")));
  const missing = ref.filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !ref.includes(k));
  if (missing.length || extra.length) {
    console.error(`${locale}: missing=${missing} extra=${extra}`);
    process.exitCode = 1;
  } else {
    console.log(`${locale}: key structure OK (${keys.length} keys)`);
  }
}
