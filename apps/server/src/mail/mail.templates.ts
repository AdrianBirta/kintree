export type MailLang = 'ro' | 'en' | 'hu' | 'fr' | 'de' | 'es' | 'it';

const MAIL_LANGS: MailLang[] = ['ro', 'en', 'hu', 'fr', 'de', 'es', 'it'];

export function normalizeLang(lang?: string): MailLang {
  const l = (lang ?? '').slice(0, 2).toLowerCase();
  return MAIL_LANGS.includes(l as MailLang) ? (l as MailLang) : 'en';
}

interface ActionTexts {
  subject: string;
  greeting: (name: string) => string;
  intro: string;
  button: string;
  expires: string;
  ignore: string;
}

const FALLBACK: Record<MailLang, string> = {
  ro: 'Dacă butonul nu funcționează, copiază acest link în browser:',
  en: "If the button doesn't work, copy this link into your browser:",
  hu: 'Ha a gomb nem működik, másold be ezt a linket a böngészőbe:',
  fr: 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :',
  de: 'Falls die Schaltfläche nicht funktioniert, kopiere diesen Link in deinen Browser:',
  es: 'Si el botón no funciona, copia este enlace en tu navegador:',
  it: 'Se il pulsante non funziona, copia questo link nel browser:',
};

// ───────────── resetare parolă ─────────────
const RESET: Record<MailLang, ActionTexts> = {
  ro: {
    subject: 'Resetează-ți parola eArbore',
    greeting: (n) => `Salut, ${n}!`,
    intro: 'Am primit o cerere de resetare a parolei pentru contul tău eArbore. Apasă butonul de mai jos pentru a alege o parolă nouă.',
    button: 'Alege o parolă nouă',
    expires: 'Linkul este valabil 1 oră și poate fi folosit o singură dată.',
    ignore: 'Dacă nu ai cerut tu această schimbare, ignoră acest email — parola ta rămâne neschimbată.',
  },
  en: {
    subject: 'Reset your eArbore password',
    greeting: (n) => `Hi ${n}!`,
    intro: 'We received a request to reset the password for your eArbore account. Click the button below to choose a new password.',
    button: 'Choose a new password',
    expires: 'This link is valid for 1 hour and can only be used once.',
    ignore: "If you didn't request this, just ignore this email — your password will stay the same.",
  },
  hu: {
    subject: 'Állítsd vissza az eArbore jelszavadat',
    greeting: (n) => `Szia, ${n}!`,
    intro: 'Jelszó-visszaállítási kérelmet kaptunk az eArbore fiókodhoz. Kattints az alábbi gombra az új jelszó megadásához.',
    button: 'Új jelszó megadása',
    expires: 'A link 1 óráig érvényes, és csak egyszer használható.',
    ignore: 'Ha nem te kérted, hagyd figyelmen kívül ezt az e-mailt — a jelszavad nem változik.',
  },
  fr: {
    subject: 'Réinitialisez votre mot de passe eArbore',
    greeting: (n) => `Bonjour ${n} !`,
    intro: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte eArbore. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.',
    button: 'Choisir un nouveau mot de passe',
    expires: "Ce lien est valable 1 heure et ne peut être utilisé qu'une seule fois.",
    ignore: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail — votre mot de passe reste inchangé.",
  },
  de: {
    subject: 'Setze dein eArbore-Passwort zurück',
    greeting: (n) => `Hallo ${n}!`,
    intro: 'Wir haben eine Anfrage zum Zurücksetzen des Passworts für dein eArbore-Konto erhalten. Klicke auf die Schaltfläche unten, um ein neues Passwort festzulegen.',
    button: 'Neues Passwort festlegen',
    expires: 'Der Link ist 1 Stunde gültig und kann nur einmal verwendet werden.',
    ignore: 'Wenn du das nicht angefordert hast, ignoriere diese E-Mail — dein Passwort bleibt unverändert.',
  },
  es: {
    subject: 'Restablece tu contraseña de eArbore',
    greeting: (n) => `¡Hola, ${n}!`,
    intro: 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de eArbore. Pulsa el botón de abajo para elegir una nueva contraseña.',
    button: 'Elegir una nueva contraseña',
    expires: 'El enlace es válido durante 1 hora y solo puede usarse una vez.',
    ignore: 'Si no lo solicitaste tú, ignora este correo: tu contraseña no cambiará.',
  },
  it: {
    subject: 'Reimposta la tua password di eArbore',
    greeting: (n) => `Ciao ${n}!`,
    intro: 'Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account eArbore. Clicca sul pulsante qui sotto per scegliere una nuova password.',
    button: 'Scegli una nuova password',
    expires: 'Il link è valido per 1 ora e può essere usato una sola volta.',
    ignore: 'Se non sei stato tu a richiederlo, ignora questa email: la tua password resta invariata.',
  },
};

// ───────────── confirmare email ─────────────
const VERIFY: Record<MailLang, ActionTexts> = {
  ro: {
    subject: 'Confirmă-ți adresa de email eArbore',
    greeting: (n) => `Bun venit, ${n}!`,
    intro: 'Mulțumim că ți-ai creat un cont eArbore. Confirmă-ți adresa de email apăsând butonul de mai jos pentru a-ți activa contul.',
    button: 'Confirmă emailul',
    expires: 'Linkul este valabil 24 de ore și poate fi folosit o singură dată.',
    ignore: 'Dacă nu ți-ai creat tu acest cont, poți ignora acest email — nu se va crea niciun cont.',
  },
  en: {
    subject: 'Confirm your eArbore email',
    greeting: (n) => `Welcome, ${n}!`,
    intro: 'Thanks for creating an eArbore account. Confirm your email address by clicking the button below to activate your account.',
    button: 'Confirm email',
    expires: 'This link is valid for 24 hours and can only be used once.',
    ignore: "If you didn't create this account, you can safely ignore this email — no account will be created.",
  },
  hu: {
    subject: 'Erősítsd meg az eArbore e-mail-címedet',
    greeting: (n) => `Üdv, ${n}!`,
    intro: 'Köszönjük, hogy létrehoztál egy eArbore fiókot. Kattints az alábbi gombra az e-mail-címed megerősítéséhez és a fiókod aktiválásához.',
    button: 'E-mail megerősítése',
    expires: 'A link 24 óráig érvényes, és csak egyszer használható.',
    ignore: 'Ha nem te hoztad létre ezt a fiókot, nyugodtan figyelmen kívül hagyhatod ezt az e-mailt — nem jön létre fiók.',
  },
  fr: {
    subject: 'Confirmez votre adresse e-mail eArbore',
    greeting: (n) => `Bienvenue, ${n} !`,
    intro: "Merci d'avoir créé un compte eArbore. Confirmez votre adresse e-mail en cliquant sur le bouton ci-dessous pour activer votre compte.",
    button: "Confirmer l'e-mail",
    expires: "Ce lien est valable 24 heures et ne peut être utilisé qu'une seule fois.",
    ignore: "Si vous n'avez pas créé ce compte, ignorez cet e-mail — aucun compte ne sera créé.",
  },
  de: {
    subject: 'Bestätige deine eArbore-E-Mail-Adresse',
    greeting: (n) => `Willkommen, ${n}!`,
    intro: 'Danke, dass du ein eArbore-Konto erstellt hast. Bestätige deine E-Mail-Adresse über die Schaltfläche unten, um dein Konto zu aktivieren.',
    button: 'E-Mail bestätigen',
    expires: 'Der Link ist 24 Stunden gültig und kann nur einmal verwendet werden.',
    ignore: 'Falls du dieses Konto nicht erstellt hast, ignoriere diese E-Mail — es wird kein Konto angelegt.',
  },
  es: {
    subject: 'Confirma tu correo de eArbore',
    greeting: (n) => `¡Bienvenido, ${n}!`,
    intro: 'Gracias por crear una cuenta en eArbore. Confirma tu correo electrónico pulsando el botón de abajo para activar tu cuenta.',
    button: 'Confirmar correo',
    expires: 'El enlace es válido durante 24 horas y solo puede usarse una vez.',
    ignore: 'Si no creaste esta cuenta, ignora este correo: no se creará ninguna cuenta.',
  },
  it: {
    subject: 'Conferma la tua email di eArbore',
    greeting: (n) => `Benvenuto, ${n}!`,
    intro: 'Grazie per aver creato un account eArbore. Conferma il tuo indirizzo email cliccando sul pulsante qui sotto per attivare il tuo account.',
    button: 'Conferma email',
    expires: 'Il link è valido per 24 ore e può essere usato una sola volta.',
    ignore: 'Se non hai creato tu questo account, ignora questa email: non verrà creato alcun account.',
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderActionEmail(lang: MailLang, t: ActionTexts, name: string, link: string) {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);

  const html = `<!doctype html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f8f6fb;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6fb;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e1f0;border-radius:16px;padding:32px;">
        <tr><td style="font-size:22px;font-weight:800;color:#4f2a8c;padding-bottom:20px;">eArbore</td></tr>
        <tr><td style="font-size:18px;font-weight:700;color:#1f1a2b;padding-bottom:12px;">${t.greeting(safeName)}</td></tr>
        <tr><td style="font-size:15px;line-height:1.6;color:#5b5468;padding-bottom:24px;">${t.intro}</td></tr>
        <tr><td style="padding-bottom:24px;">
          <a href="${safeLink}" style="display:inline-block;background:#6236ad;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:12px;">${t.button}</a>
        </td></tr>
        <tr><td style="font-size:13px;line-height:1.6;color:#5b5468;padding-bottom:8px;">${t.expires}</td></tr>
        <tr><td style="font-size:13px;line-height:1.6;color:#5b5468;padding-bottom:20px;">${t.ignore}</td></tr>
        <tr><td style="font-size:12px;line-height:1.5;color:#9a94a8;border-top:1px solid #e7e1f0;padding-top:16px;">
          ${FALLBACK[lang]}<br>
          <a href="${safeLink}" style="color:#6236ad;word-break:break-all;">${safeLink}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${t.greeting(name)}\n\n${t.intro}\n\n${link}\n\n${t.expires}\n${t.ignore}`;

  return { subject: t.subject, html, text };
}

export function renderPasswordResetEmail(langInput: string | undefined, name: string, link: string) {
  const lang = normalizeLang(langInput);
  return renderActionEmail(lang, RESET[lang], name, link);
}

export function renderVerifyEmail(langInput: string | undefined, name: string, link: string) {
  const lang = normalizeLang(langInput);
  return renderActionEmail(lang, VERIFY[lang], name, link);
}