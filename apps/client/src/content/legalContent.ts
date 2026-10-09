// ─────────────────────────────────────────────────────────────
// COMPLETEAZĂ aceste valori înainte de lansare
// ─────────────────────────────────────────────────────────────
export const SITE_URL = 'https://earbore.ro';
export const OPERATOR_NAME = 'eArbore.ro';
export const OPERATOR_ADDRESS = 'Ioan Slavici, Sanmartin, Bihor, România';
export const CONTACT_EMAIL = 'contact@earbore.ro';
export const LEGAL_LAST_UPDATED = '2026-10-09';

export interface LegalSection {
  id?: string;
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDoc {
  title: string;
  intro: string[];
  sections: LegalSection[];
}

type Lang = 'ro' | 'en';
type Kind = 'privacy' | 'terms';

export const LEGAL_CONTENT: Record<Lang, Record<Kind, LegalDoc>> = {
  // ═════════════════════════ ROMÂNĂ ═════════════════════════
  ro: {
    privacy: {
      title: 'Politica de confidențialitate',
      intro: [
        `Această politică explică ce date personale prelucrăm prin platforma eArbore (${SITE_URL}), de ce, cât timp le păstrăm și ce drepturi ai, conform Regulamentului (UE) 2016/679 (GDPR).`,
      ],
      sections: [
        {
          id: 'operator',
          heading: '1. Cine este operatorul datelor',
          paragraphs: [
            `Operatorul datelor este ${OPERATOR_NAME}, cu adresa în ${OPERATOR_ADDRESS}.`,
            `Pentru orice solicitare legată de datele tale personale ne poți scrie la: ${CONTACT_EMAIL}.`,
          ],
        },
        {
          id: 'data',
          heading: '2. Ce date prelucrăm',
          list: [
            'Date de cont: prenume, nume, adresa de email și parola (stocată exclusiv sub formă de hash, pe care nu o putem citi).',
            'Autentificare socială (opțională): identificatorul contului Google, Facebook sau Yahoo, adresa de email, numele și, dacă există, poza de profil, așa cum ne sunt oferite de acel serviciu.',
            'Conținutul arborelui tău genealogic: nume, date de naștere și de deces, fotografii, biografii, ocupație, studii, înălțime, grupă sanguină (toate opționale) și relațiile dintre persoane.',
            'Mesajele trimise prin funcția de mesagerie și informații despre conversații (participanți, momentul citirii).',
            'Date de partajare: linkurile de distribuire create, accesele acordate și, pentru vizitatorii care folosesc un link, un identificator tehnic și numele afișat, dacă îl introduc.',
            'Date tehnice: adresa IP (la cererile către server, pentru limitarea abuzurilor și, o singură dată, pentru detectarea țării în vederea alegerii limbii interfeței) și jetoane de sesiune.',
            'Numărul de click-uri pe butonul de donație (agregat, fără date personale).',
          ],
        },
        {
          id: 'third-parties',
          heading: '3. Date despre alte persoane și date despre sănătate',
          paragraphs: [
            'Arborele genealogic conține, prin natura lui, date despre alte persoane (rude, inclusiv persoane decedate sau minore). Ești responsabil să introduci astfel de date doar dacă ai dreptul să o faci și, pentru persoanele în viață, de preferință cu acordul lor. La cererea unei persoane vizate, vom șterge datele care o privesc.',
            'Grupa sanguină este o dată privind sănătatea (categorie specială de date, art. 9 GDPR). Este complet opțională. O prelucrăm doar pe baza consimțământului tău explicit, exprimat prin introducerea ei, și o poți șterge oricând din profilul membrului. Te rugăm să nu introduci date medicale ale altor persoane fără acordul lor.',
          ],
        },
        {
          id: 'purposes',
          heading: '4. Scopuri și temeiuri legale',
          list: [
            'Furnizarea serviciului (cont, arbore, partajare, mesagerie): executarea contractului (art. 6 alin. 1 lit. b).',
            'Emailuri tranzacționale (confirmarea adresei, resetarea parolei): executarea contractului. Nu trimitem emailuri de marketing.',
            'Securitate și prevenirea abuzurilor (limitarea numărului de cereri, jetoane de sesiune): interes legitim (art. 6 alin. 1 lit. f).',
            'Alegerea automată a limbii în funcție de țară: interes legitim. Poți schimba oricând limba manual.',
            'Date despre sănătate (grupa sanguină): consimțământ explicit (art. 9 alin. 2 lit. a).',
          ],
        },
        {
          id: 'cookies',
          heading: '5. Cookie-uri și stocare locală',
          paragraphs: [
            'Nu folosim cookie-uri de marketing sau de analiză și nu urmărim comportamentul tău pe alte site-uri.',
            'Folosim stocarea locală a browserului (localStorage) pentru jetoanele de autentificare, limba aleasă și preferințele de afișare. Sunt strict necesare funcționării serviciului.',
            'Fonturile sunt încărcate de la Google Fonts, ceea ce implică transmiterea adresei tale IP către Google.',
          ],
        },
        {
          id: 'processors',
          heading: '6. Cui transmitem datele',
          paragraphs: [
            'Nu vindem datele tale. Le transmitem doar furnizorilor care ne ajută să operăm serviciul, în baza unor contracte de prelucrare:',
          ],
          list: [
            'Vercel (găzduirea aplicației web) și Railway (găzduirea serverului).',
            'Furnizorul bazei de date PostgreSQL în care sunt stocate datele.',
            'Cloudinary (stocarea fotografiilor).',
            'Resend (trimiterea emailurilor de confirmare și resetare).',
            'Google, Meta (Facebook) și Yahoo, doar dacă alegi autentificarea socială.',
            'ipapi.co (detectarea țării după adresa IP, pentru limba interfeței).',
            'Google Fonts (fonturi).',
            'Buy Me a Coffee, dacă alegi să donezi: plata se face pe platforma lor, noi nu primim datele cardului tău.',
          ],
        },
        {
          heading: '7. Transferuri în afara Spațiului Economic European',
          paragraphs: [
            'Unii furnizori pot prelucra date în afara SEE (de exemplu în SUA). În aceste cazuri ne bazăm pe garanții adecvate, precum clauzele contractuale standard ale Comisiei Europene sau Cadrul de confidențialitate UE-SUA.',
          ],
        },
        {
          id: 'retention',
          heading: '8. Cât timp păstrăm datele',
          list: [
            'Datele contului și ale arborelui: cât timp contul este activ sau până la cererea ta de ștergere.',
            'Sesiunile de autentificare: maximum 7 zile.',
            'Linkurile de resetare a parolei: 1 oră. Linkurile de confirmare a emailului: 24 de ore.',
            'Copiile de siguranță ale furnizorilor pot păstra datele pentru o perioadă limitată după ștergere.',
          ],
        },
        {
          id: 'data-deletion',
          heading: '9. Ștergerea contului și a datelor',
          paragraphs: [
            `Poți cere ștergerea contului și a tuturor datelor asociate trimițând un email la ${CONTACT_EMAIL}, de pe adresa contului, cu subiectul „Ștergere cont". Finalizăm cererea în maximum 30 de zile.`,
            'Membrii arborelui, fotografiile și mesajele pot fi șterse oricând și direct din aplicație.',
            'Dacă te-ai autentificat cu Facebook, Google sau Yahoo, revocarea accesului aplicației din setările acelui serviciu nu șterge datele din eArbore. Pentru ștergere urmează pașii de mai sus.',
          ],
        },
        {
          id: 'rights',
          heading: '10. Drepturile tale',
          paragraphs: [
            'Ai dreptul de acces, rectificare, ștergere, restricționare a prelucrării, portabilitate și opoziție, precum și dreptul de a-ți retrage oricând consimțământul (fără a afecta prelucrările anterioare). Răspundem în maximum 30 de zile.',
            'Ai dreptul să depui o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP): www.dataprotection.ro.',
          ],
        },
        {
          heading: '11. Securitate',
          paragraphs: [
            'Folosim conexiuni criptate (HTTPS), stocăm parolele doar sub formă de hash, limităm numărul de încercări de autentificare și restricționăm accesul la date. Niciun sistem nu este însă complet invulnerabil.',
          ],
        },
        {
          heading: '12. Minori',
          paragraphs: [
            'Serviciul nu se adresează persoanelor sub 16 ani fără acordul părinților sau al reprezentanților legali.',
          ],
        },
        {
          heading: '13. Modificări',
          paragraphs: [
            'Putem actualiza această politică. Data ultimei actualizări este afișată în partea de sus a paginii. Pentru modificări semnificative te vom anunța în aplicație sau prin email.',
          ],
        },
      ],
    },

    terms: {
      title: 'Termeni și condiții',
      intro: [
        `Acești termeni reglementează utilizarea platformei eArbore (${SITE_URL}), oferită de ${OPERATOR_NAME}. Prin crearea unui cont sau prin utilizarea serviciului, ești de acord cu ei.`,
      ],
      sections: [
        {
          heading: '1. Serviciul',
          paragraphs: [
            'eArbore te ajută să construiești, să păstrezi și să partajezi un arbore genealogic: membri, fotografii, povești, relații, statistici și mesagerie între utilizatori.',
          ],
        },
        {
          heading: '2. Contul tău',
          list: [
            'Trebuie să ai cel puțin 16 ani sau acordul părinților ori al reprezentanților legali.',
            'Datele de înregistrare trebuie să fie corecte, iar adresa de email trebuie să îți aparțină și să fie confirmată.',
            'Ești responsabil pentru confidențialitatea parolei și pentru activitatea din contul tău. Anunță-ne imediat dacă bănuiești o folosire neautorizată.',
          ],
        },
        {
          heading: '3. Conținutul tău',
          paragraphs: [
            'Rămâi titularul drepturilor asupra conținutului introdus (texte, fotografii, date). Ne acorzi o licență limitată, neexclusivă, pentru a-l stoca, procesa și afișa exclusiv în scopul furnizării serviciului, inclusiv către persoanele cu care alegi să îl partajezi.',
            'Garantezi că ai dreptul să introduci conținutul respectiv, inclusiv datele despre alte persoane, și că acesta nu încalcă drepturile terților sau legea. Nu este permis conținut ilegal, defăimător, discriminatoriu, obscen sau care încalcă viața privată a altora.',
          ],
        },
        {
          heading: '4. Partajarea arborelui',
          paragraphs: [
            'Poți partaja arborele prin linkuri sau către alte conturi, cu drept de vizualizare sau de editare. Persoanele cu acces pot vedea (și, la nivel de editare, modifica sau adăuga) conținutul. Alegi tu cui oferi accesul și îl poți revoca oricând. Ești responsabil pentru persoanele cărora le trimiți un link.',
          ],
        },
        {
          heading: '5. Utilizare acceptabilă',
          list: [
            'Nu încerca să accesezi conturile sau datele altor utilizatori.',
            'Nu bloca, supraîncărca, copia automat în masă sau testa vulnerabilitățile serviciului fără acordul nostru scris.',
            'Nu folosi serviciul pentru spam, hărțuire sau activități ilegale.',
          ],
        },
        {
          heading: '6. Serviciu gratuit și donații',
          paragraphs: [
            'Serviciul este oferit în prezent gratuit. Donațiile sunt complet voluntare, se fac pe platforma Buy Me a Coffee, nu oferă drepturi suplimentare și nu sunt rambursabile de către noi.',
          ],
        },
        {
          heading: '7. Disponibilitate',
          paragraphs: [
            'Serviciul este oferit „ca atare". Depunem eforturi rezonabile pentru funcționarea lui, dar nu garantăm disponibilitate neîntreruptă sau lipsa erorilor. Îți recomandăm să păstrezi și copii ale fotografiilor și textelor importante. Putem modifica, suspenda sau opri funcții ale serviciului.',
          ],
        },
        {
          heading: '8. Limitarea răspunderii',
          paragraphs: [
            'În măsura permisă de lege, nu răspundem pentru pierderi indirecte sau pentru pierderea de date rezultate din folosirea serviciului. Nu excludem și nu limităm răspunderea care nu poate fi exclusă sau limitată conform legii (de exemplu pentru fapte săvârșite cu intenție sau din culpă gravă).',
          ],
        },
        {
          heading: '9. Suspendare și închiderea contului',
          paragraphs: [
            'Poți înceta oricând utilizarea serviciului și poți cere ștergerea contului (vezi Politica de confidențialitate). Putem suspenda sau închide un cont care încalcă acești termeni sau legea.',
          ],
        },
        {
          heading: '10. Proprietate intelectuală',
          paragraphs: [
            'Platforma, designul, denumirea și codul sursă aparțin operatorului sau licențiatorilor săi. Acești termeni nu îți transferă niciun drept asupra lor, în afara dreptului de a folosi serviciul.',
          ],
        },
        {
          heading: '11. Legea aplicabilă',
          paragraphs: [
            'Acești termeni sunt guvernați de legea română. Disputele se soluționează amiabil, iar în caz contrar de instanțele române competente. Drepturile tale de consumator din Uniunea Europeană rămân neafectate.',
          ],
        },
        {
          heading: '12. Modificări',
          paragraphs: [
            'Putem actualiza acești termeni. Continuarea utilizării serviciului după modificări înseamnă acceptarea lor. Data ultimei actualizări este afișată în partea de sus a paginii.',
          ],
        },
        {
          heading: '13. Contact',
          paragraphs: [`Întrebări despre acești termeni: ${CONTACT_EMAIL}.`],
        },
      ],
    },
  },

  // ═════════════════════════ ENGLISH ═════════════════════════
  en: {
    privacy: {
      title: 'Privacy Policy',
      intro: [
        `This policy explains what personal data we process through the eArbore platform (${SITE_URL}), why, how long we keep it and what rights you have, under Regulation (EU) 2016/679 (GDPR).`,
      ],
      sections: [
        {
          id: 'operator',
          heading: '1. Who is the data controller',
          paragraphs: [
            `The data controller is ${OPERATOR_NAME}, located at ${OPERATOR_ADDRESS}.`,
            `For any request about your personal data, contact us at: ${CONTACT_EMAIL}.`,
          ],
        },
        {
          id: 'data',
          heading: '2. What data we process',
          list: [
            'Account data: first name, last name, email address and password (stored only as a hash that we cannot read).',
            'Social sign-in (optional): your Google, Facebook or Yahoo account identifier, email address, name and, if available, profile picture, as provided by that service.',
            'Your family tree content: names, birth and death dates, photos, biographies, occupation, education, height, blood type (all optional) and the relationships between people.',
            'Messages sent through the messaging feature and conversation information (participants, read time).',
            'Sharing data: share links you create, access you grant and, for visitors using a link, a technical identifier and the display name if they enter one.',
            'Technical data: IP address (on requests to our server, for abuse prevention and, once, to detect your country to choose the interface language) and session tokens.',
            'The number of clicks on the donation button (aggregated, no personal data).',
          ],
        },
        {
          id: 'third-parties',
          heading: '3. Data about other people and health data',
          paragraphs: [
            'A family tree by nature contains data about other people (relatives, including deceased persons and minors). You are responsible for entering such data only if you are entitled to do so and, for living persons, preferably with their consent. At the request of a data subject, we will delete the data concerning them.',
            'Blood type is health data (a special category under Art. 9 GDPR). It is entirely optional. We process it only on the basis of your explicit consent, given by entering it, and you can delete it at any time from the member profile. Please do not enter other people\'s medical data without their consent.',
          ],
        },
        {
          id: 'purposes',
          heading: '4. Purposes and legal bases',
          list: [
            'Providing the service (account, tree, sharing, messaging): performance of a contract (Art. 6(1)(b)).',
            'Transactional emails (email confirmation, password reset): performance of a contract. We do not send marketing emails.',
            'Security and abuse prevention (rate limiting, session tokens): legitimate interest (Art. 6(1)(f)).',
            'Automatic language selection based on country: legitimate interest. You can change the language manually at any time.',
            'Health data (blood type): explicit consent (Art. 9(2)(a)).',
          ],
        },
        {
          id: 'cookies',
          heading: '5. Cookies and local storage',
          paragraphs: [
            'We do not use marketing or analytics cookies and we do not track your behavior on other websites.',
            'We use the browser\'s local storage (localStorage) for authentication tokens, your chosen language and display preferences. These are strictly necessary for the service to work.',
            'Fonts are loaded from Google Fonts, which involves sending your IP address to Google.',
          ],
        },
        {
          id: 'processors',
          heading: '6. Who we share data with',
          paragraphs: [
            'We do not sell your data. We share it only with providers that help us operate the service, under data processing agreements:',
          ],
          list: [
            'Vercel (web app hosting) and Railway (server hosting).',
            'The PostgreSQL database provider where the data is stored.',
            'Cloudinary (photo storage).',
            'Resend (sending confirmation and reset emails).',
            'Google, Meta (Facebook) and Yahoo, only if you choose social sign-in.',
            'ipapi.co (country detection from IP address, for the interface language).',
            'Google Fonts (fonts).',
            'Buy Me a Coffee, if you choose to donate: payment happens on their platform and we do not receive your card details.',
          ],
        },
        {
          heading: '7. Transfers outside the European Economic Area',
          paragraphs: [
            'Some providers may process data outside the EEA (for example in the USA). In such cases we rely on appropriate safeguards, such as the European Commission\'s Standard Contractual Clauses or the EU-US Data Privacy Framework.',
          ],
        },
        {
          id: 'retention',
          heading: '8. How long we keep data',
          list: [
            'Account and tree data: while the account is active or until you request deletion.',
            'Authentication sessions: up to 7 days.',
            'Password reset links: 1 hour. Email confirmation links: 24 hours.',
            'Provider backups may retain data for a limited period after deletion.',
          ],
        },
        {
          id: 'data-deletion',
          heading: '9. Deleting your account and data',
          paragraphs: [
            `You can request deletion of your account and all associated data by emailing ${CONTACT_EMAIL} from your account address, with the subject "Account deletion". We complete requests within 30 days.`,
            'Tree members, photos and messages can be deleted at any time directly in the app.',
            'If you signed in with Facebook, Google or Yahoo, revoking the app\'s access in that service\'s settings does not delete your data from eArbore. To delete it, follow the steps above.',
          ],
        },
        {
          id: 'rights',
          heading: '10. Your rights',
          paragraphs: [
            'You have the right of access, rectification, erasure, restriction of processing, portability and objection, and the right to withdraw consent at any time (without affecting earlier processing). We reply within 30 days.',
            'You have the right to lodge a complaint with your data protection authority. In Romania this is ANSPDCP: www.dataprotection.ro.',
          ],
        },
        {
          heading: '11. Security',
          paragraphs: [
            'We use encrypted connections (HTTPS), store passwords only as hashes, limit authentication attempts and restrict access to data. No system is completely invulnerable, however.',
          ],
        },
        {
          heading: '12. Children',
          paragraphs: [
            'The service is not directed at people under 16 without the consent of a parent or legal guardian.',
          ],
        },
        {
          heading: '13. Changes',
          paragraphs: [
            'We may update this policy. The date of the last update is shown at the top of the page. For significant changes we will notify you in the app or by email.',
          ],
        },
      ],
    },

    terms: {
      title: 'Terms and Conditions',
      intro: [
        `These terms govern the use of the eArbore platform (${SITE_URL}), provided by ${OPERATOR_NAME}. By creating an account or using the service, you agree to them.`,
      ],
      sections: [
        {
          heading: '1. The service',
          paragraphs: [
            'eArbore helps you build, keep and share a family tree: members, photos, stories, relationships, statistics and messaging between users.',
          ],
        },
        {
          heading: '2. Your account',
          list: [
            'You must be at least 16 or have the consent of a parent or legal guardian.',
            'Registration details must be accurate, and your email address must belong to you and be confirmed.',
            'You are responsible for keeping your password confidential and for activity in your account. Tell us immediately if you suspect unauthorized use.',
          ],
        },
        {
          heading: '3. Your content',
          paragraphs: [
            'You remain the owner of the content you enter (text, photos, data). You grant us a limited, non-exclusive license to store, process and display it solely to provide the service, including to the people you choose to share it with.',
            'You warrant that you are entitled to enter that content, including data about other people, and that it does not infringe third-party rights or the law. Illegal, defamatory, discriminatory or obscene content, or content that violates others\' privacy, is not allowed.',
          ],
        },
        {
          heading: '4. Sharing your tree',
          paragraphs: [
            'You can share your tree through links or with other accounts, with view or edit permission. People with access can see (and, with edit permission, change or add) content. You choose who gets access and can revoke it at any time. You are responsible for the people you send a link to.',
          ],
        },
        {
          heading: '5. Acceptable use',
          list: [
            'Do not try to access other users\' accounts or data.',
            'Do not block, overload, mass-scrape or test the service for vulnerabilities without our written permission.',
            'Do not use the service for spam, harassment or illegal activity.',
          ],
        },
        {
          heading: '6. Free service and donations',
          paragraphs: [
            'The service is currently provided free of charge. Donations are entirely voluntary, are made on the Buy Me a Coffee platform, grant no additional rights and are not refundable by us.',
          ],
        },
        {
          heading: '7. Availability',
          paragraphs: [
            'The service is provided "as is". We make reasonable efforts to keep it running, but do not guarantee uninterrupted availability or freedom from errors. We recommend keeping your own copies of important photos and texts. We may change, suspend or discontinue features of the service.',
          ],
        },
        {
          heading: '8. Limitation of liability',
          paragraphs: [
            'To the extent permitted by law, we are not liable for indirect losses or loss of data resulting from use of the service. We do not exclude or limit liability that cannot be excluded or limited by law (for example for intentional acts or gross negligence).',
          ],
        },
        {
          heading: '9. Suspension and closing your account',
          paragraphs: [
            'You may stop using the service at any time and request deletion of your account (see the Privacy Policy). We may suspend or close an account that violates these terms or the law.',
          ],
        },
        {
          heading: '10. Intellectual property',
          paragraphs: [
            'The platform, design, name and source code belong to the operator or its licensors. These terms do not transfer any rights in them to you, other than the right to use the service.',
          ],
        },
        {
          heading: '11. Governing law',
          paragraphs: [
            'These terms are governed by Romanian law. Disputes will be resolved amicably and, failing that, by the competent Romanian courts. Your consumer rights as an EU resident are not affected.',
          ],
        },
        {
          heading: '12. Changes',
          paragraphs: [
            'We may update these terms. Continuing to use the service after changes means you accept them. The date of the last update is shown at the top of the page.',
          ],
        },
        {
          heading: '13. Contact',
          paragraphs: [`Questions about these terms: ${CONTACT_EMAIL}.`],
        },
      ],
    },
  },
};