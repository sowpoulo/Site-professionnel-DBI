import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Check,
  CircleAlert, FileText, Globe2, Menu, PenLine, Plus, Send, ShieldCheck,
  Trash2, X,
} from 'lucide-react';
import {
  getGetAdminIdentityQueryKey, getGetAdminOverviewQueryKey, getListAdminInquiriesQueryKey,
  getListAdminNewsQueryKey, getListPublishedNewsQueryKey, useCreateAdminNews, useCreateInquiry,
  useDeleteAdminNews, useGetAdminIdentity, useGetAdminOverview, useListAdminInquiries,
  useListAdminNews, useListPublishedNews, useUpdateAdminInquiry, useUpdateAdminNews,
} from '@workspace/api-client-react';
import type { InquiryInput, NewsItem, NewsInput, NewsUpdate } from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import heroImage from '@assets/generated_images/dbi-mobility-hero.jpg';
import privateVehiclesImage from '@assets/generated_images/dbi-private-vehicles.jpg';
import utilityVehiclesImage from '@assets/generated_images/dbi-utility-vehicles.jpg';
import collectiveTransportImage from '@assets/generated_images/dbi-collective-transport.jpg';
import industrialVehiclesImage from '@assets/generated_images/dbi-industrial-vehicles.jpg';
import centreConceptImage from '@assets/generated_images/dbi-centre-concept.jpg';

const vehicleImages = [privateVehiclesImage, utilityVehiclesImage, collectiveTransportImage, industrialVehiclesImage];

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

type Lang = 'fr' | 'en';
const copy = {
  fr: {
    nav: ['Accueil', 'À propos', 'Solutions', 'Programme mobilité', 'Centre de services', 'Partenariats', 'Actualités'],
    contact: 'Parlons de votre projet', home: 'Accueil', crumb: 'DJIBY’S BUSINESS INTERNATIONAL',
    eyebrow: 'Mobilité · Sénégal · Afrique de l’Ouest',
    heroTitle: 'Faire avancer la mobilité.\nConstruire la confiance.',
    heroBody: 'DBI développe des solutions automobiles et de mobilité pensées pour les particuliers, les entreprises et les acteurs du transport au Sénégal.',
    explore: 'Découvrir DBI', talk: 'Échanger avec notre équipe', quote: 'Demander un devis',
    homeIntro: 'Une ambition industrielle, ancrée au Sénégal',
    homeText: 'DJIBY’S BUSINESS INTERNATIONAL travaille à structurer un écosystème automobile plus accessible, mieux intégré et durablement connecté aux besoins du territoire.',
    objective: 'Objectif de première phase', cars: '5 000 véhicules', objectiveNote: 'Un objectif de déploiement initial, conditionné par les financements, les partenariats et les conditions de marché.',
    ambition: 'Ambition stratégique indicative', tenYears: 'Jusqu’à 35 000', ambitionNote: 'Sur dix ans. Une ambition indicative, dépendante du financement, des partenariats et des conditions de marché.',
    approach: 'Une approche construite pour durer', journey: 'De la demande à la mobilité suivie',
    journeyText: 'Du choix d’un véhicule à son entretien, DBI porte une vision intégrée de la mobilité. Les dispositifs et infrastructures sont en cours de développement.',
    steps: ['Comprendre les usages', 'Structurer les solutions', 'Développer les services'],
    stepsText: ['Des réponses adaptées aux réalités des particuliers et des organisations.', 'Un programme de renouvellement progressif et des pistes de collaboration.', 'Un centre intégré de maintenance et de formation en développement.'],
    categories: 'Des véhicules pour des usages différents', allSolutions: 'Voir les solutions',
    categoriesLead: 'Une offre à structurer autour de besoins concrets, de la mobilité quotidienne aux usages professionnels et collectifs.',
    categoriesList: ['Voitures particulières', 'Véhicules utilitaires', 'Transport collectif', 'Véhicules industriels'],
    project: 'Projet en développement', centreTitle: 'Un centre intégré, au service du cycle de vie',
    centreLead: 'DBI développe un projet de centre automobile intégré associant maintenance, accompagnement technique et formation. Le projet est en cours de structuration.',
    learn: 'Découvrir le projet', news: 'Actualités DBI', newsEmpty: 'Aucun article publié pour le moment.',
    newsRetry: 'Impossible de charger les actualités.', retry: 'Réessayer',
    contactTitle: 'Mettons votre projet en mouvement.', contactLead: 'Décrivez votre besoin. Notre équipe vous répondra à l’adresse indiquée, dans la mesure des informations disponibles.',
    formName: 'Nom complet', email: 'Adresse e-mail', company: 'Organisation (facultatif)', country: 'Pays (facultatif)', phone: 'Téléphone (facultatif)', kind: 'Votre demande concerne', message: 'Votre message', send: 'Envoyer la demande',
    kinds: { quote: 'Demande de devis', partnership: 'Partenariat', supplier: 'Fournisseur', financing: 'Financement', after_sales: 'Après-vente', other: 'Autre demande' },
    formSuccess: 'Votre message a bien été transmis. Merci de votre confiance.', formError: 'La demande n’a pas pu être envoyée. Veuillez réessayer ou écrire directement à notre adresse e-mail.',
    required: 'Champ obligatoire', aboutTitle: 'Ancrés à Dakar. Ouverts sur les mobilités de demain.',
    aboutLead: 'DJIBY’S BUSINESS INTERNATIONAL est une entreprise sénégalaise qui développe des activités automobiles et de mobilité au service d’une diversité d’acteurs.',
    mission: 'Notre mission', missionText: 'Faciliter l’accès à des solutions automobiles et contribuer à bâtir une mobilité mieux structurée, avec une attention portée à la qualité de service et à la durabilité.',
    vision: 'Notre vision', visionText: 'Participer à l’émergence d’un écosystème automobile intégré au Sénégal et connecté aux opportunités régionales.',
    values: 'Nos valeurs', valuesText: ['Fiabilité dans les engagements', 'Transparence dans les échanges', 'Professionnalisme au quotidien', 'Innovation adaptée aux usages', 'Partenariats durables', 'Développement des compétences locales'],
    partnerApproach: 'Une approche de partenariat durable', partnerApproachText: 'DBI souhaite construire des relations de long terme avec les fournisseurs, les clients professionnels, les coopératives, les partenaires techniques et financiers. Chaque collaboration est étudiée selon les besoins, les capacités mobilisées et les conditions du marché.',
    solutionsTitle: 'Des solutions adaptées aux usages.', solutionsLead: 'DBI structure une offre automobile destinée aux particuliers et aux organisations. Les disponibilités et conditions sont étudiées au cas par cas.',
    types: ['Voitures particulières', 'Véhicules utilitaires', 'Transport collectif', 'Véhicules industriels'],
    typeLead: ['Pour les déplacements personnels et familiaux.', 'Pour accompagner les activités professionnelles et les opérations quotidiennes.', 'Pour les coopératives et opérateurs de transport collectif.', 'Pour les besoins de chantiers, de logistique et d’activités productives.'],
    mobilityTitle: 'Un programme progressif de renouvellement.',
    mobilityLead: 'Le programme de mobilité de DBI vise à organiser, par étapes, l’accès à des véhicules adaptés et leur accompagnement dans la durée.',
    phase: 'Phase', phases: ['Écouter et qualifier les besoins', 'Construire les partenariats et les solutions', 'Déployer par étapes selon les moyens mobilisés'],
    phaseNote: 'L’objectif de première phase est de 5 000 véhicules. L’ambition stratégique indicative est d’aller jusqu’à 35 000 véhicules sur dix ans. Ces objectifs dépendent des financements, des partenariats et des conditions de marché ; ils ne constituent pas des volumes déjà réalisés ou garantis.',
    programmeSupportTitle: 'Un accompagnement pensé dans la durée', programmeSupport: ['Des solutions de géolocalisation GPS et de gestion de flotte pourront être intégrées selon les véhicules et les contrats.', 'Le développement du service après-vente accompagnera progressivement le déploiement.', 'La démarche est conçue pour les professionnels, les coopératives et les opérateurs de transport.'],
    centerTitle: 'Un projet de centre intégré en développement.',
    centerLead: 'DBI travaille à la structuration d’un centre automobile qui pourrait rapprocher maintenance, accompagnement après-vente et formation technique.',
    centerNote: 'Il s’agit d’un projet en développement. Les capacités, le calendrier et les modalités restent à confirmer.',
    centerServicesTitle: 'Activités envisagées', centerServices: ['Mécanique générale et entretien préventif', 'Réparations et diagnostic électronique', 'Carrosserie, redressage et peinture automobile', 'Service après-vente et gestion des pièces de rechange', 'Formation professionnelle et transfert de compétences'],
    centerGoalsTitle: 'Objectifs du projet', centerGoals: ['Améliorer la disponibilité des véhicules', 'Renforcer la qualité des interventions', 'Développer les compétences techniques locales', 'Contribuer à la création d’emplois', 'Structurer progressivement un réseau de maintenance'],
    partnerTitle: 'Construire des collaborations utiles.',
    partnerLead: 'DBI est ouverte aux échanges avec les acteurs qui souhaitent contribuer au développement de solutions de mobilité au Sénégal.',
    partnerTypes: ['Constructeurs et fournisseurs automobiles', 'Distributeurs et partenaires commerciaux', 'Fournisseurs d’équipements d’atelier', 'Partenaires technologiques et GPS', 'Organismes de formation', 'Coopératives et opérateurs de transport', 'Partenaires financiers et investisseurs', 'Partenaires logistiques'],
    partnershipWaysTitle: 'Pistes de collaboration', partnershipWays: ['Distribution et fourniture de véhicules', 'Développement de solutions de mobilité', 'Mise en place progressive du service après-vente', 'Fourniture d’équipements techniques', 'Développement des compétences locales', 'Étude de projets d’assemblage à long terme selon leur faisabilité'],
    partnerPrompt: 'Vous représentez une organisation ? Présentez-nous votre proposition.',
    partnersTitle: 'Des partenariats à construire', partnersText: 'Les marques et logos des partenaires seront publiés ici uniquement après autorisation.',
    articlesTitle: 'Actualités et publications DBI', articleLoading: 'Chargement des publications…',
    policyTitle: 'Politique de confidentialité', legalTitle: 'Mentions légales',
    confirm: 'À confirmer par DBI avant publication', admin: 'Administration DBI', adminDesc: 'Espace réservé à l’équipe habilitée.',
    signIn: 'Connexion administrateur', signInHelp: 'Connectez-vous avec votre compte autorisé pour accéder à la boîte de réception et aux publications.',
    notAdmin: 'Votre compte est connecté, mais il ne dispose pas de l’accès administrateur DBI.', adminSetup: 'L’accès est géré par une liste d’adresses administrateur configurée côté serveur. Contactez le responsable DBI pour demander un accès.',
    overview: 'Vue d’ensemble', inquiries: 'Demandes reçues', articles: 'Articles', total: 'Toutes les demandes', newOnes: 'Nouvelles', published: 'Publiés', drafts: 'Brouillons',
    noInquiries: 'Aucune demande pour le moment.', inboxErr: 'La boîte de réception n’est pas disponible.', loading: 'Chargement…',
    status: { new: 'Nouvelle', in_progress: 'En cours', closed: 'Clôturée' }, state: { published: 'Publié', draft: 'Brouillon' },
    edit: 'Modifier', delete: 'Supprimer', createArticle: 'Nouvel article', save: 'Enregistrer', cancel: 'Annuler',
    title: 'Titre', slug: 'Identifiant URL', excerpt: 'Résumé', content: 'Contenu', category: 'Catégorie', imageUrl: 'URL de l’image (facultatif)', statusLabel: 'Publication',
    deleteConfirm: 'Supprimer définitivement cet article ?', noArticles: 'Aucun article dans le gestionnaire.', articleError: 'Impossible de charger les articles.',
    adminError: 'Impossible de vérifier les autorisations administrateur.', backHome: 'Retour au site', signOut: 'Se déconnecter',
    footerText: 'Mobilité et solutions automobiles, développées au Sénégal.', address: 'Fass Mbao, Dakar, Sénégal', emailLabel: 'Écrivez-nous',
    privacyLead: 'Cette page présente les principes de traitement des informations transmises via le site. Les éléments indiqués comme à confirmer doivent être validés par DBI avant publication définitive.',
    legalLead: 'Informations légales relatives au site de DJIBY’S BUSINESS INTERNATIONAL. Les champs en attente doivent être complétés et confirmés par DBI.',
    principles: ['Les informations envoyées via les formulaires sont utilisées pour traiter la demande et y répondre.', 'Les données ne sont pas publiées sur ce site.', 'Les demandes de correction ou de suppression peuvent être adressées à l’adresse e-mail de DBI.'],
    legalFields: ['Forme juridique : à confirmer par DBI', 'Capital social : à confirmer par DBI', 'Numéro d’immatriculation : à confirmer par DBI', 'Directeur de publication : à confirmer par DBI', 'Hébergeur du site : à confirmer par DBI'],
    contactDetails: 'Coordonnées confirmées', noMap: 'Aucune carte ou numéro de téléphone n’est publié sur cette page.',
    readArticle: 'Lire l’article', noArticleContent: 'Cet article ne contient pas encore de contenu public.', articleMissing: 'Cet article n’est pas disponible.',
    menu: 'Ouvrir le menu', closeMenu: 'Fermer le menu', language: 'English',
  },
  en: {
    nav: ['Home', 'About', 'Solutions', 'Mobility programme', 'Service centre', 'Partnerships', 'News'],
    contact: 'Discuss your project', home: 'Home', crumb: 'DJIBY’S BUSINESS INTERNATIONAL',
    eyebrow: 'Mobility · Senegal · West Africa',
    heroTitle: 'Moving mobility forward.\nBuilding trust.',
    heroBody: 'DBI is developing automotive and mobility solutions for individuals, businesses and transport operators in Senegal.',
    explore: 'Discover DBI', talk: 'Talk to our team',
    homeIntro: 'An industrial ambition, rooted in Senegal',
    homeText: 'DJIBY’S BUSINESS INTERNATIONAL is working to structure a more accessible, integrated automotive ecosystem connected to the needs of the region.',
    objective: 'First-phase objective', cars: '5,000 vehicles', objectiveNote: 'An initial deployment objective, subject to funding, partnerships and market conditions.',
    ambition: 'Indicative strategic ambition', tenYears: 'Up to 35,000', ambitionNote: 'Over ten years. An indicative ambition dependent on funding, partnerships and market conditions.',
    approach: 'An approach built to last', journey: 'From demand to supported mobility',
    journeyText: 'From vehicle selection to maintenance, DBI has an integrated vision for mobility. Its programmes and infrastructure are under development.',
    steps: ['Understand use cases', 'Structure solutions', 'Develop services'],
    stepsText: ['Responses shaped around the realities of individuals and organisations.', 'A phased renewal programme and opportunities to collaborate.', 'An integrated maintenance and training centre in development.'],
    categories: 'Vehicles for different needs', allSolutions: 'Explore solutions',
    categoriesLead: 'An offer shaped around practical needs, from everyday mobility to professional and collective use.',
    categoriesList: ['Private cars', 'Utility vehicles', 'Collective transport', 'Industrial vehicles'],
    project: 'Project in development', centreTitle: 'An integrated centre for the vehicle lifecycle',
    centreLead: 'DBI is developing an integrated automotive centre project bringing together maintenance, technical support and training. The project is being structured.',
    learn: 'Explore the project', news: 'DBI news', newsEmpty: 'No articles have been published yet.',
    newsRetry: 'News could not be loaded.', retry: 'Try again',
    contactTitle: 'Let’s move your project forward.', contactLead: 'Tell us what you need. Our team will respond to the address provided, based on the information available.',
    formName: 'Full name', email: 'Email address', company: 'Organisation (optional)', country: 'Country (optional)', phone: 'Phone (optional)', kind: 'Your enquiry is about', message: 'Your message', send: 'Send enquiry',
    kinds: { quote: 'Quotation', partnership: 'Partnership', supplier: 'Supplier', financing: 'Financing', after_sales: 'After-sales', other: 'Other enquiry' },
    formSuccess: 'Your message has been sent. Thank you for reaching out.', formError: 'Your enquiry could not be sent. Please try again or email us directly.',
    required: 'Required field', aboutTitle: 'Rooted in Dakar. Open to tomorrow’s mobility.',
    aboutLead: 'DJIBY’S BUSINESS INTERNATIONAL is a Senegalese company developing automotive and mobility activities for a diverse range of stakeholders.',
    mission: 'Our mission', missionText: 'Make automotive solutions more accessible and help build better-structured mobility, with a focus on service quality and durability.',
    vision: 'Our vision', visionText: 'Contribute to the emergence of an integrated automotive ecosystem in Senegal, connected to regional opportunities.',
    values: 'Our values', valuesText: ['Reliability in our commitments', 'Transparency in our dealings', 'Professionalism in our work', 'Innovation shaped around real needs', 'Long-term partnerships', 'Local skills development'],
    partnerApproach: 'A long-term partnership approach', partnerApproachText: 'DBI aims to build lasting relationships with suppliers, business customers, cooperatives, technical partners and financial institutions. Each opportunity is considered in light of needs, available capabilities and market conditions.',
    solutionsTitle: 'Solutions shaped around real needs.', solutionsLead: 'DBI is structuring automotive solutions for individuals and organisations. Availability and terms are considered case by case.',
    types: ['Private cars', 'Utility vehicles', 'Collective transport', 'Industrial vehicles'],
    typeLead: ['For personal and family journeys.', 'To support business activity and day-to-day operations.', 'For transport cooperatives and collective mobility operators.', 'For construction, logistics and productive activities.'],
    mobilityTitle: 'A phased vehicle renewal programme.',
    mobilityLead: 'DBI’s mobility programme aims to organise access to suitable vehicles in stages, with support throughout their lifecycle.',
    phase: 'Phase', phases: ['Listen and qualify needs', 'Build partnerships and solutions', 'Deploy in stages as resources are secured'],
    phaseNote: 'The first-phase objective is 5,000 vehicles. The indicative strategic ambition is up to 35,000 vehicles over ten years. These objectives depend on funding, partnerships and market conditions; they do not represent volumes already achieved or guaranteed.',
    programmeSupportTitle: 'Support designed for the long term', programmeSupport: ['GPS tracking and fleet management may be integrated depending on the vehicles and contracts.', 'After-sales support will develop progressively alongside deployment.', 'The programme is intended for businesses, cooperatives and transport operators.'],
    centerTitle: 'An integrated centre project in development.',
    centerLead: 'DBI is working to structure an automotive centre that could bring together maintenance, after-sales support and technical training.',
    centerNote: 'This is a project in development. Capacity, timing and operating arrangements remain to be confirmed.',
    centerServicesTitle: 'Activities under consideration', centerServices: ['General mechanics and preventive maintenance', 'Repairs and electronic diagnostics', 'Bodywork, straightening and automotive paint', 'After-sales support and spare-parts management', 'Vocational training and skills transfer'],
    centerGoalsTitle: 'Project objectives', centerGoals: ['Improve vehicle availability', 'Strengthen the quality of repairs', 'Develop local technical skills', 'Contribute to job creation', 'Build a maintenance network progressively'],
    partnerTitle: 'Building valuable collaborations.',
    partnerLead: 'DBI welcomes conversations with organisations interested in contributing to mobility solutions in Senegal.',
    partnerTypes: ['Automotive manufacturers and suppliers', 'Distributors and commercial partners', 'Workshop equipment suppliers', 'Technology and GPS partners', 'Training organisations', 'Transport cooperatives and operators', 'Financial partners and investors', 'Logistics partners'],
    partnershipWaysTitle: 'Areas for collaboration', partnershipWays: ['Vehicle distribution and supply', 'Mobility solution development', 'Progressive after-sales service development', 'Workshop equipment supply', 'Local skills development', 'Long-term assembly project studies, subject to feasibility'],
    partnerPrompt: 'Represent an organisation? Tell us about your proposal.',
    partnersTitle: 'Partnerships to build', partnersText: 'Partner names and logos will appear here only after permission has been granted.',
    articlesTitle: 'DBI news and publications', articleLoading: 'Loading publications…',
    policyTitle: 'Privacy policy', legalTitle: 'Legal notice',
    confirm: 'To be confirmed by DBI before publication', admin: 'DBI administration', adminDesc: 'Reserved for authorised team members.',
    signIn: 'Administrator sign-in', signInHelp: 'Sign in with an authorised account to access the inbox and publications.',
    notAdmin: 'You are signed in, but your account does not have DBI administrator access.', adminSetup: 'Access is managed through a server-configured administrator email allowlist. Contact the DBI owner to request access.',
    overview: 'Overview', inquiries: 'Enquiries', articles: 'Articles', total: 'All enquiries', newOnes: 'New', published: 'Published', drafts: 'Drafts',
    noInquiries: 'No enquiries yet.', inboxErr: 'The inbox is unavailable.', loading: 'Loading…',
    status: { new: 'New', in_progress: 'In progress', closed: 'Closed' }, state: { published: 'Published', draft: 'Draft' },
    edit: 'Edit', delete: 'Delete', createArticle: 'New article', save: 'Save', cancel: 'Cancel',
    title: 'Title', slug: 'URL slug', excerpt: 'Excerpt', content: 'Content', category: 'Category', imageUrl: 'Image URL (optional)', statusLabel: 'Publication',
    deleteConfirm: 'Permanently delete this article?', noArticles: 'There are no articles in the manager.', articleError: 'Articles could not be loaded.',
    adminError: 'Administrator access could not be checked.', backHome: 'Back to site', signOut: 'Sign out',
    footerText: 'Mobility and automotive solutions, developed in Senegal.', address: 'Fass Mbao, Dakar, Senegal', emailLabel: 'Email us',
    privacyLead: 'This page explains how information submitted through this website is handled. Items marked for confirmation must be validated by DBI before final publication.',
    legalLead: 'Legal information for DJIBY’S BUSINESS INTERNATIONAL. Outstanding fields must be completed and confirmed by DBI.',
    principles: ['Information submitted through forms is used to process and respond to the enquiry.', 'Personal information is not published on this website.', 'Requests to correct or remove information can be sent to DBI by email.'],
    legalFields: ['Legal form: to be confirmed by DBI', 'Share capital: to be confirmed by DBI', 'Registration number: to be confirmed by DBI', 'Publication director: to be confirmed by DBI', 'Website host: to be confirmed by DBI'],
    contactDetails: 'Confirmed contact details', noMap: 'No map or phone number is published on this page.',
    readArticle: 'Read article', noArticleContent: 'This article does not yet have public content.', articleMissing: 'This article is not available.',
    menu: 'Open menu', closeMenu: 'Close menu', language: 'Français',
  },
};

type Copy = typeof copy.fr;
const navPaths = ['/', '/about', '/solutions', '/mobility-program', '/service-center', '/partnerships', '/news'];
const seo: Record<string, { fr: [string, string]; en: [string, string] }> = {
  '/': { fr: ['Mobilité automobile au Sénégal | DBI', 'DBI développe des solutions automobiles et de mobilité pour les particuliers, les entreprises et les acteurs du transport au Sénégal.'], en: ['Automotive mobility in Senegal | DBI', 'DBI develops automotive and mobility solutions for individuals, businesses and transport operators in Senegal.'] },
  '/about': { fr: ['À propos de DBI | Mobilité au Sénégal', 'Découvrez la mission, la vision et les principes de DJIBY’S BUSINESS INTERNATIONAL, entreprise sénégalaise de mobilité.'], en: ['About DBI | Mobility in Senegal', 'Discover the mission, vision and principles of DJIBY’S BUSINESS INTERNATIONAL, a Senegalese mobility company.'] },
  '/solutions': { fr: ['Solutions automobiles | DBI Sénégal', 'Voitures particulières, utilitaires, transport collectif et véhicules industriels : les solutions en structuration chez DBI.'], en: ['Automotive solutions | DBI Senegal', 'Private cars, utility vehicles, collective transport and industrial vehicles: solutions being structured by DBI.'] },
  '/mobility-program': { fr: ['Programme de mobilité | DBI Sénégal', 'Le programme progressif de renouvellement des véhicules porté par DJIBY’S BUSINESS INTERNATIONAL.'], en: ['Mobility programme | DBI Senegal', 'DBI’s phased vehicle renewal programme, with objectives dependent on funding, partnerships and market conditions.'] },
  '/service-center': { fr: ['Centre automobile intégré | Projet DBI', 'Un projet en développement de centre intégré de maintenance et de formation automobile au Sénégal.'], en: ['Integrated automotive centre | DBI project', 'An integrated automotive maintenance and training centre project in development in Senegal.'] },
  '/partnerships': { fr: ['Partenariats mobilité | DBI Sénégal', 'Échangez avec DBI sur les opportunités de collaboration dans l’automobile et la mobilité au Sénégal.'], en: ['Mobility partnerships | DBI Senegal', 'Explore collaboration opportunities with DBI in automotive and mobility in Senegal.'] },
  '/news': { fr: ['Actualités DBI | Publications', 'Retrouvez les articles publiés par DJIBY’S BUSINESS INTERNATIONAL.'], en: ['DBI news | Publications', 'Read published articles from DJIBY’S BUSINESS INTERNATIONAL.'] },
  '/contact': { fr: ['Contact et devis | DBI Sénégal', 'Contactez DJIBY’S BUSINESS INTERNATIONAL à Fass Mbao, Dakar, ou transmettez une demande en ligne.'], en: ['Contact and enquiries | DBI Senegal', 'Contact DJIBY’S BUSINESS INTERNATIONAL in Fass Mbao, Dakar, or send an enquiry online.'] },
  '/privacy': { fr: ['Politique de confidentialité | DBI', 'Principes de confidentialité applicables aux demandes transmises au site de DBI.'], en: ['Privacy policy | DBI', 'Privacy principles for enquiries submitted through the DBI website.'] },
  '/legal': { fr: ['Mentions légales | DBI', 'Mentions légales de DJIBY’S BUSINESS INTERNATIONAL avec les champs à confirmer avant publication.'], en: ['Legal notice | DBI', 'Legal notice for DJIBY’S BUSINESS INTERNATIONAL, including fields pending confirmation.'] },
  '/admin': { fr: ['Administration | DBI', 'Espace de gestion des demandes et des articles DBI.'], en: ['Administration | DBI', 'DBI enquiry inbox and article management.'] },
};

function Meta({ path, lang }: { path: string; lang: Lang }) {
  useEffect(() => {
    const entry = seo[path] ?? seo['/news'];
    const [title, description] = entry[lang];
    document.title = title;
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) { desc = document.createElement('meta'); desc.setAttribute('name', 'description'); document.head.appendChild(desc); }
    desc.setAttribute('content', description);
    const ogTitle = document.querySelector('meta[property="og:title"]') ?? document.head.appendChild(document.createElement('meta'));
    ogTitle.setAttribute('property', 'og:title'); ogTitle.setAttribute('content', title);
    const ogDescription = document.querySelector('meta[property="og:description"]') ?? document.head.appendChild(document.createElement('meta'));
    ogDescription.setAttribute('property', 'og:description'); ogDescription.setAttribute('content', description);
    const ogType = document.querySelector('meta[property="og:type"]') ?? document.head.appendChild(document.createElement('meta'));
    ogType.setAttribute('property', 'og:type'); ogType.setAttribute('content', 'website');
    const canonicalPath = path === '/' ? '' : path;
    const canonicalUrl = `${window.location.origin}${basePath}${canonicalPath || '/'}`;
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.head.appendChild(document.createElement('link'));
    canonical.setAttribute('rel', 'canonical'); canonical.setAttribute('href', canonicalUrl);
    const ogUrl = document.querySelector('meta[property="og:url"]') ?? document.head.appendChild(document.createElement('meta'));
    ogUrl.setAttribute('property', 'og:url'); ogUrl.setAttribute('content', canonicalUrl);
    const ogImage = document.querySelector('meta[property="og:image"]') ?? document.head.appendChild(document.createElement('meta'));
    ogImage.setAttribute('property', 'og:image'); ogImage.setAttribute('content', new URL(heroImage, window.location.href).href);
    const twitterCard = document.querySelector('meta[name="twitter:card"]') ?? document.head.appendChild(document.createElement('meta'));
    twitterCard.setAttribute('name', 'twitter:card'); twitterCard.setAttribute('content', 'summary_large_image');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]') ?? document.head.appendChild(document.createElement('meta'));
    twitterTitle.setAttribute('name', 'twitter:title'); twitterTitle.setAttribute('content', title);
    const twitterDescription = document.querySelector('meta[name="twitter:description"]') ?? document.head.appendChild(document.createElement('meta'));
    twitterDescription.setAttribute('name', 'twitter:description'); twitterDescription.setAttribute('content', description);
    const twitterImage = document.querySelector('meta[name="twitter:image"]') ?? document.head.appendChild(document.createElement('meta'));
    twitterImage.setAttribute('name', 'twitter:image'); twitterImage.setAttribute('content', new URL(heroImage, window.location.href).href);
  }, [path, lang]);
  return null;
}

function useLang() {
  const [lang, setLang] = useState<Lang>(() => {
    try { return localStorage.getItem('dbi-language') === 'en' ? 'en' : 'fr'; } catch { return 'fr'; }
  });
  const toggle = () => setLang((current) => {
    const next = current === 'fr' ? 'en' : 'fr';
    try { localStorage.setItem('dbi-language', next); } catch { /* storage may be unavailable */ }
    return next;
  });
  return { lang, t: copy[lang], toggle };
}

function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brand flex items-center gap-3 ${light ? 'text-white' : 'text-[#102A43]'}`} data-testid="link-brand">
    <span className="grid h-10 w-10 place-items-center border border-[#C6A15B] font-display text-[11px] font-extrabold tracking-[-.08em]">DBI</span>
    <span className="leading-tight"><span className="block font-display text-[13px] font-extrabold tracking-[.11em]">DJIBY’S</span><span className="block text-[9px] font-bold tracking-[.16em] opacity-75">BUSINESS INTERNATIONAL</span></span>
  </Link>;
}
function Header({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const links = t.nav.map((label, i) => ({ label, href: navPaths[i] }));
  return <header className="relative z-20 bg-[#F3F6F8]">
    <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-12">
      <Brand />
      <nav aria-label={lang === 'fr' ? 'Navigation principale' : 'Main navigation'} className="hidden items-center gap-6 xl:flex">
        {links.map((item, i) => <Link key={item.href} href={item.href} aria-current={location === item.href ? 'page' : undefined} className="nav-link text-[12px] font-semibold text-[#314b5f] hover:text-[#102A43]" data-testid={`nav-${item.href.slice(1) || 'home'}`}>{item.label}</Link>)}
      </nav>
      <div className="hidden items-center gap-4 xl:flex">
        <button onClick={toggle} className="flex items-center gap-1.5 text-xs font-bold text-[#1F5B85]" data-testid="button-language"><Globe2 size={15} />{lang === 'fr' ? 'EN' : 'FR'}</button>
        <Link href="/contact" className="btn-primary !px-4 !py-3 text-xs" data-testid="link-header-contact">{t.contact}<ArrowUpRight size={14} /></Link>
      </div>
      <div className="flex items-center gap-4 xl:hidden">
        <button onClick={toggle} className="text-xs font-bold text-[#1F5B85]" aria-label={t.language} data-testid="button-language-mobile">{lang === 'fr' ? 'EN' : 'FR'}</button>
        <button onClick={() => setOpen(!open)} className="grid h-10 w-10 place-items-center border border-[#d4dfe6]" aria-label={open ? t.closeMenu : t.menu} aria-expanded={open} data-testid="button-mobile-menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
    </div>
    {open && <nav className="absolute inset-x-0 top-full bg-[#F3F6F8] px-5 pb-6 shadow-lg xl:hidden" aria-label={lang === 'fr' ? 'Navigation mobile' : 'Mobile navigation'}>
      <div className="grid">
        {links.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="border-t border-[#dbe3e8] py-3 text-sm font-semibold text-[#102A43]" data-testid={`mobile-nav-${item.href.slice(1) || 'home'}`}>{item.label}</Link>)}
        <Link href="/contact" onClick={() => setOpen(false)} className="btn-primary mt-3" data-testid="link-mobile-contact">{t.contact}<ArrowRight size={16} /></Link>
      </div>
    </nav>}
  </header>;
}

function Footer({ t, lang }: { t: Copy; lang: Lang }) {
  return <footer className="bg-[#102A43] text-white">
    <div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-14 md:grid-cols-[1.3fr_.7fr_1fr] lg:px-12 lg:py-20">
      <div><Brand light /><p className="mt-6 max-w-sm text-sm leading-7 text-white/65">{t.footerText}</p></div>
      <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#C6A15B]">{lang === 'fr' ? 'Explorer' : 'Explore'}</p><div className="mt-5 grid gap-3 text-sm text-white/75"><Link href="/about" data-testid="footer-about">{t.nav[1]}</Link><Link href="/solutions" data-testid="footer-solutions">{t.nav[2]}</Link><Link href="/partnerships" data-testid="footer-partnerships">{t.nav[5]}</Link><Link href="/news" data-testid="footer-news">{t.nav[6]}</Link></div></div>
      <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#C6A15B]">{t.contactDetails}</p><p className="mt-5 text-sm text-white/75" data-testid="text-address">{t.address}</p><a className="mt-3 block text-sm text-white underline decoration-[#C6A15B] underline-offset-4" href="mailto:djibrilcisse155463@gmail.com" data-testid="link-email">djibrilcisse155463@gmail.com</a><p className="mt-3 text-xs text-white/45">{t.noMap}</p></div>
    </div>
    <div className="border-t border-white/15"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-3 px-5 py-5 text-xs text-white/50 sm:flex-row lg:px-12"><span>© DJIBY’S BUSINESS INTERNATIONAL (DBI)</span><div className="flex gap-5"><Link href="/privacy" data-testid="footer-privacy">{lang === 'fr' ? 'Confidentialité' : 'Privacy'}</Link><Link href="/legal" data-testid="footer-legal">{lang === 'fr' ? 'Mentions légales' : 'Legal notice'}</Link><Link href="/admin" data-testid="footer-admin">Admin</Link></div></div></div>
  </footer>;
}

function Layout({ children, path, t, lang, toggle, admin = false }: { children: ReactNode; path: string; t: Copy; lang: Lang; toggle: () => void; admin?: boolean }) {
  return <div className="site-grain min-h-[100dvh]"><Meta path={path} lang={lang} />{admin ? null : <Header t={t} lang={lang} toggle={toggle} />}<main>{children}</main>{admin ? null : <Footer t={t} lang={lang} />}</div>;
}

function Eyebrow({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <p className={`mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.2em] ${light ? 'text-[#ddc282]' : 'text-[#1F5B85]'}`}><span className="inline-block h-px w-8 bg-[#C6A15B]" />{children}</p>;
}
function PageHead({ crumb, title, lead }: { crumb: string; title: string; lead: string }) {
  return <section className="bg-[#F3F6F8]"><div className="mx-auto max-w-[1280px] px-5 pb-14 pt-12 lg:px-12 lg:pb-20 lg:pt-16">
    <p className="mb-10 text-[10px] font-bold uppercase tracking-[.18em] text-[#71838e]">{crumb}</p><Eyebrow>DBI · Senegal</Eyebrow>
    <h1 className="font-display max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-[-.045em] text-[#102A43] md:text-6xl">{title}</h1>
    <p className="mt-6 max-w-2xl text-base leading-7 text-[#526978] md:text-lg md:leading-8">{lead}</p>
  </div></section>;
}
function Home({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  const { data, isLoading, isError, refetch } = useListPublishedNews();
  return <Layout path="/" t={t} lang={lang} toggle={toggle}>
    <section className="relative isolate overflow-hidden bg-[#102A43] text-white">
      <img src={heroImage} alt="" width="1024" height="1024" fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_78%]" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#102A43]/95 via-[#102A43]/80 to-[#102A43]/45" />
      <div className="absolute inset-0 -z-10 opacity-30"><div className="absolute -right-20 top-0 h-[700px] w-[62%] skew-x-[-13deg] border-l border-[#C6A15B]/70 bg-[#1F5B85]/30" /><div className="absolute right-[12%] top-[-18%] h-[900px] w-px rotate-[30deg] bg-[#C6A15B]/50" /><div className="absolute bottom-[-18%] right-[2%] h-[600px] w-[52%] rotate-[-12deg] border border-white/20" /><div className="absolute right-[14%] top-[20%] h-[280px] w-[280px] rounded-full border border-white/15" /></div>
      <div className="mx-auto grid min-h-[620px] max-w-[1440px] items-center gap-10 px-5 py-20 md:min-h-[690px] lg:grid-cols-[1.04fr_.96fr] lg:px-12 lg:py-24">
        <div className="reveal relative z-10 max-w-3xl"><Eyebrow light>{t.eyebrow}</Eyebrow><h1 className="font-display whitespace-pre-line text-[clamp(3rem,7vw,6.6rem)] font-extrabold leading-[.99] tracking-[-.055em]">{t.heroTitle}</h1><p className="mt-8 max-w-xl text-base leading-7 text-white/75 md:text-lg md:leading-8">{t.heroBody}</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link className="inline-flex items-center justify-center gap-3 bg-[#C6A15B] px-6 py-4 text-sm font-bold text-[#102A43] transition hover:bg-[#ddc282]" href="/about" data-testid="link-hero-about">{t.explore}<ArrowUpRight size={17} /></Link><Link className="inline-flex items-center justify-center gap-3 border border-white/40 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10" href="/contact" data-testid="link-hero-contact">{t.talk}<ArrowRight size={16} /></Link></div></div>
        <div className="relative hidden min-h-[430px] lg:block"><div className="absolute right-3 top-4 h-[360px] w-[82%] border border-white/20" /><div className="absolute right-10 top-0 h-[360px] w-[82%] bg-[#1F5B85]/35" /><div className="absolute right-0 top-16 h-[340px] w-[88%] border border-[#C6A15B]/65" /><div className="absolute right-[17%] top-[112px] h-[170px] w-[58%] border-l-[3px] border-[#C6A15B] bg-[#173e5d] p-7"><div className="grid h-full grid-cols-2 gap-4"><div className="border border-white/20" /><div className="border border-white/20" /><div className="col-span-2 border-t border-white/20" /></div></div><div className="absolute bottom-0 left-3 text-right"><span className="font-display text-6xl font-extrabold text-white/90">DBI</span><span className="ml-3 text-[10px] uppercase tracking-[.25em] text-[#ddc282]">Dakar · Sénégal</span></div><div className="absolute right-0 top-0 flex h-14 w-14 items-center justify-center border border-[#C6A15B] text-[#ddc282]"><ArrowDownRight size={23} /></div></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C6A15B]" />
    </section>
    <section className="mx-auto grid max-w-[1280px] gap-12 px-5 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-12 lg:py-28">
      <div><Eyebrow>{t.crumb}</Eyebrow><h2 className="font-display text-3xl font-extrabold leading-tight tracking-[-.035em] md:text-5xl">{t.homeIntro}</h2><p className="mt-6 max-w-xl leading-7 text-[#526978]">{t.homeText}</p><Link className="mt-8 inline-flex items-center gap-3 text-sm font-bold text-[#1F5B85]" href="/about" data-testid="link-home-about">{t.explore}<ArrowRight size={16} /></Link></div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex min-h-[225px] flex-col justify-between bg-[#F3F6F8] p-7"><span className="text-[10px] font-bold uppercase tracking-[.17em] text-[#1F5B85]">{t.objective}</span><div><p className="font-display text-4xl font-extrabold tracking-[-.045em] text-[#102A43]">{t.cars}</p><p className="mt-4 text-sm leading-6 text-[#586d7a]">{t.objectiveNote}</p></div></div>
        <div className="flex min-h-[225px] flex-col justify-between border border-[#C6A15B] bg-white p-7"><span className="text-[10px] font-bold uppercase tracking-[.17em] text-[#8b6b2b]">{t.ambition}</span><div><p className="font-display text-4xl font-extrabold tracking-[-.045em] text-[#102A43]">{t.tenYears}</p><p className="mt-4 text-sm leading-6 text-[#586d7a]">{t.ambitionNote}</p></div></div>
      </div>
    </section>
    <section className="bg-[#eaf0f4]"><div className="mx-auto max-w-[1280px] px-5 py-20 lg:px-12 lg:py-24"><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><Eyebrow>{t.approach}</Eyebrow><h2 className="font-display max-w-md text-3xl font-extrabold leading-tight tracking-[-.035em] md:text-4xl">{t.journey}</h2><p className="mt-5 max-w-md text-sm leading-7 text-[#526978]">{t.journeyText}</p></div><div className="grid gap-0 md:grid-cols-3">{t.steps.map((s, i) => <div key={s} className="border-t border-[#b8c7d0] py-6 md:border-l md:border-t-0 md:px-6"><span className="font-display text-3xl font-extrabold text-[#C6A15B]">0{i + 1}</span><h3 className="mt-6 font-display text-xl font-extrabold">{s}</h3><p className="mt-3 text-sm leading-6 text-[#526978]">{t.stepsText[i]}</p></div>)}</div></div></div></section>
     <section className="mx-auto max-w-[1280px] px-5 py-20 lg:px-12 lg:py-24"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><Eyebrow>{t.crumb}</Eyebrow><h2 className="font-display text-3xl font-extrabold tracking-[-.035em] md:text-4xl">{t.categories}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[#526978]">{t.categoriesLead}</p></div><Link href="/solutions" className="inline-flex items-center gap-2 pb-1 text-sm font-bold text-[#1F5B85]" data-testid="link-all-solutions">{t.allSolutions}<ArrowRight size={15} /></Link></div><div className="mt-10 grid gap-px bg-[#dbe4e9] sm:grid-cols-2 lg:grid-cols-4">{t.categoriesList.map((item, i) => <Link href="/solutions" key={item} className="group bg-white p-0 transition hover:bg-[#F3F6F8]" data-testid={`card-category-${i}`}><img src={vehicleImages[i]} alt="" width="640" height="480" loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:brightness-105" /><div className="p-6"><span className="text-xs font-bold text-[#C6A15B]">0{i + 1}</span><h3 className="mt-4 font-display text-xl font-extrabold text-[#102A43]">{item}</h3><span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#1F5B85]">{t.learn}<ArrowUpRight size={14} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" /></span></div></Link>)}</div></section>
    <section className="bg-[#102A43] text-white"><div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-16 md:grid-cols-[.7fr_1.3fr] md:items-center lg:px-12 lg:py-20"><div><Eyebrow light>{t.project}</Eyebrow><h2 className="font-display text-3xl font-extrabold tracking-[-.04em] md:text-4xl">{t.centreTitle}</h2></div><div><p className="max-w-2xl leading-7 text-white/70">{t.centreLead}</p><Link href="/service-center" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#ddc282]" data-testid="link-center">{t.learn}<ArrowRight size={16} /></Link></div></div></section>
     <section className="border-t border-[#dfe6eb] bg-[#F3F6F8]"><div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-12 md:grid-cols-[.75fr_1.25fr] md:items-center lg:px-12"><div><Eyebrow>{t.partnerPrompt}</Eyebrow><h2 className="font-display text-2xl font-extrabold text-[#102A43]">{t.partnersTitle}</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#526978]">{t.partnersText}</p></div><div className="grid min-h-24 place-items-center border border-dashed border-[#9eafb9] p-6 text-center text-xs font-semibold text-[#71838e]" data-testid="partner-logo-placeholder">{lang === 'fr' ? 'Espace réservé aux logos de partenaires autorisés' : 'Reserved for approved partner logos'}</div></div></section>
    <NewsStrip t={t} lang={lang} data={data} isLoading={isLoading} isError={isError} refetch={refetch} />
    <ContactBand t={t} />
  </Layout>;
}

function NewsStrip({ t, lang, data, isLoading, isError, refetch }: { t: Copy; lang: Lang; data?: NewsItem[]; isLoading: boolean; isError: boolean; refetch: () => void }) {
  return <section className="mx-auto max-w-[1280px] px-5 py-20 lg:px-12 lg:py-24"><div className="flex items-end justify-between gap-4"><div><Eyebrow>{t.crumb}</Eyebrow><h2 className="font-display text-3xl font-extrabold">{t.news}</h2></div><Link href="/news" className="hidden items-center gap-2 text-sm font-bold text-[#1F5B85] sm:flex" data-testid="link-all-news">{t.readArticle}<ArrowRight size={15} /></Link></div>
    {isLoading ? <div className="mt-8 grid gap-4 sm:grid-cols-2"><div className="h-36 animate-pulse bg-[#edf1f4]" /><div className="h-36 animate-pulse bg-[#edf1f4]" /></div> : isError ? <div className="mt-8 flex items-center gap-3 text-sm text-[#8b3b35]" role="alert"><CircleAlert size={18} />{t.newsRetry}<button className="underline" onClick={() => refetch()} data-testid="button-news-retry">{t.retry}</button></div> : data?.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{data.slice(0, 2).map((article) => <Link href={`/news/${article.slug}`} key={article.id} className="group border-t border-[#d6e0e6] py-5" data-testid={`news-card-${article.id}`}><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8b6b2b]">{article.category}</p><h3 className="mt-3 font-display text-xl font-bold text-[#102A43] group-hover:text-[#1F5B85]">{article.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-[#526978]">{article.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#1F5B85]">{t.readArticle}<ArrowRight size={14} /></span></Link>)}</div> : <p className="mt-8 border-t border-[#d6e0e6] py-6 text-sm text-[#526978]" data-testid="empty-public-news">{t.newsEmpty}</p>}
  </section>;
}
function ContactBand({ t }: { t: Copy }) {
  return <section className="border-t border-[#dfe6eb] bg-[#F3F6F8]"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-7 px-5 py-12 md:flex-row md:items-center lg:px-12"><div><Eyebrow>{t.crumb}</Eyebrow><h2 className="font-display text-2xl font-extrabold md:text-3xl">{t.contactTitle}</h2></div><Link href="/contact" className="btn-primary self-start md:self-auto" data-testid="link-contact-band">{t.contact}<ArrowRight size={16} /></Link></div></section>;
}

function InquiryForm({ t, kindDefault = 'other' }: { t: Copy; kindDefault?: InquiryInput['kind'] }) {
  const mutation = useCreateInquiry();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [kind, setKind] = useState<InquiryInput['kind']>(kindDefault);
  const [values, setValues] = useState({ name: '', email: '', company: '', country: '', phone: '', message: '' });
  const change = (key: keyof typeof values, value: string) => setValues((v) => ({ ...v, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setSuccess(false);
    const payload: InquiryInput = { ...values, kind, company: values.company || null, country: values.country || null, phone: values.phone || null };
    mutation.mutate({ data: payload }, {
      onSuccess: () => { setSuccess(true); setValues({ name: '', email: '', company: '', country: '', phone: '', message: '' }); },
      onError: () => setError(t.formError),
    });
  };
  const label = (text: string, field: string, required = false) => <label className="mb-2 block text-xs font-bold text-[#29465b]" htmlFor={`inquiry-${field}`}>{text}{required && <span className="ml-1 text-[#a34438]">*</span>}</label>;
  return <form onSubmit={submit} className="grid gap-5" data-testid="form-inquiry">
    <div className="grid gap-5 sm:grid-cols-2"><div>{label(t.formName, 'name', true)}<input id="inquiry-name" className="field" required minLength={2} maxLength={160} value={values.name} onChange={(e) => change('name', e.target.value)} autoComplete="name" data-testid="input-inquiry-name" /></div><div>{label(t.email, 'email', true)}<input id="inquiry-email" className="field" type="email" required value={values.email} onChange={(e) => change('email', e.target.value)} autoComplete="email" data-testid="input-inquiry-email" /></div></div>
    <div className="grid gap-5 sm:grid-cols-2"><div>{label(t.company, 'company')}<input id="inquiry-company" className="field" value={values.company} onChange={(e) => change('company', e.target.value)} data-testid="input-inquiry-company" /></div><div>{label(t.country, 'country')}<input id="inquiry-country" className="field" value={values.country} onChange={(e) => change('country', e.target.value)} data-testid="input-inquiry-country" /></div></div>
    <div className="grid gap-5 sm:grid-cols-2"><div>{label(t.phone, 'phone')}<input id="inquiry-phone" className="field" type="tel" value={values.phone} onChange={(e) => change('phone', e.target.value)} data-testid="input-inquiry-phone" /></div><div>{label(t.kind, 'kind')}<select id="inquiry-kind" className="field" value={kind} onChange={(e) => setKind(e.target.value as InquiryInput['kind'])} data-testid="select-inquiry-kind">{Object.entries(t.kinds).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></div></div>
    <div>{label(t.message, 'message', true)}<textarea id="inquiry-message" className="field min-h-36 resize-y" required minLength={10} maxLength={5000} value={values.message} onChange={(e) => change('message', e.target.value)} data-testid="textarea-inquiry-message" /></div>
    {success && <p className="flex items-start gap-2 bg-[#e9f3ed] p-4 text-sm text-[#245d42]" role="status" data-testid="status-inquiry-success"><Check size={18} className="mt-0.5 shrink-0" />{t.formSuccess}</p>}
    {error && <p className="flex items-start gap-2 bg-[#f9eded] p-4 text-sm text-[#8b3b35]" role="alert" data-testid="status-inquiry-error"><CircleAlert size={18} />{error}</p>}
    <button className="btn-primary justify-self-start" disabled={mutation.isPending} type="submit" data-testid="button-inquiry-submit">{mutation.isPending ? t.loading : t.send}<Send size={15} /></button>
  </form>;
}

function Contact({ t, lang, toggle, kind = 'other' }: { t: Copy; lang: Lang; toggle: () => void; kind?: InquiryInput['kind'] }) {
  const queryKind = new URLSearchParams(window.location.search).get('kind');
  const formKind = kind === 'other' && queryKind === 'quote' ? 'quote' : kind;
  return <Layout path="/contact" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.contactTitle} lead={t.contactLead} />
    <section className="mx-auto grid max-w-[1280px] gap-12 px-5 py-14 lg:grid-cols-[.7fr_1.3fr] lg:px-12 lg:py-20"><aside><Eyebrow>{t.contactDetails}</Eyebrow><h2 className="font-display text-2xl font-extrabold text-[#102A43]">{lang === 'fr' ? 'À votre écoute, depuis Dakar.' : 'Here to listen, from Dakar.'}</h2><p className="mt-6 text-sm leading-7 text-[#526978]">{lang === 'fr' ? 'Pour toute demande de devis, de partenariat ou d’information, utilisez le formulaire.' : 'For quotations, partnerships or information, please use the enquiry form.'}</p><div className="mt-8 border-t border-[#d8e1e7] pt-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6b7d89]">{lang === 'fr' ? 'Adresse' : 'Location'}</p><p className="mt-2 text-sm font-semibold" data-testid="contact-address">{t.address}</p></div><div className="mt-6 border-t border-[#d8e1e7] pt-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#6b7d89]">{t.emailLabel}</p><a href="mailto:djibrilcisse155463@gmail.com" className="mt-2 inline-block text-sm font-semibold text-[#1F5B85] underline decoration-[#C6A15B] underline-offset-4" data-testid="contact-email">djibrilcisse155463@gmail.com</a></div></aside>
      <div className="bg-[#F3F6F8] p-5 md:p-9"><InquiryForm key={formKind} t={t} kindDefault={formKind} /></div></section></Layout>;
}

function About({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  return <Layout path="/about" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.aboutTitle} lead={t.aboutLead} />
    <section className="mx-auto grid max-w-[1280px] gap-10 px-5 py-16 md:grid-cols-2 lg:px-12 lg:py-24">{[[t.mission, t.missionText], [t.vision, t.visionText]].map(([heading, text], i) => <article key={heading} className={`border-t-2 ${i ? 'border-[#1F5B85]' : 'border-[#C6A15B]'} pt-6`}><span className="text-xs font-bold tracking-[.15em] text-[#71838e]">0{i + 1}</span><h2 className="mt-4 font-display text-3xl font-extrabold">{heading}</h2><p className="mt-5 max-w-lg leading-7 text-[#526978]">{text}</p></article>)}</section>
    <section className="bg-[#102A43] text-white"><div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-14 md:grid-cols-[.7fr_1.3fr] md:items-start lg:px-12 lg:py-20"><div><Eyebrow light>{t.crumb}</Eyebrow><h2 className="font-display text-3xl font-extrabold">{t.values}</h2></div><ul className="grid gap-3 sm:grid-cols-2">{t.valuesText.map((v, i) => <li key={v} className="flex gap-4 border-t border-white/20 py-5"><span className="text-sm font-bold text-[#ddc282]">0{i + 1}</span><span className="text-lg font-semibold">{v}</span></li>)}</ul></div></section>
    <section className="mx-auto max-w-[1280px] px-5 py-16 lg:px-12 lg:py-20"><Eyebrow>{t.crumb}</Eyebrow><h2 className="font-display text-3xl font-extrabold text-[#102A43]">{t.partnerApproach}</h2><p className="mt-5 max-w-3xl leading-7 text-[#526978]">{t.partnerApproachText}</p></section>
    <ContactBand t={t} /></Layout>;
}
function Solutions({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  return <Layout path="/solutions" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.solutionsTitle} lead={t.solutionsLead} />
    <section className="mx-auto max-w-[1280px] px-5 py-12 lg:px-12 lg:py-20"><div className="grid gap-px bg-[#dbe4e9] md:grid-cols-2">{t.types.map((type, i) => <article key={type} className="grid grid-cols-[.3fr_1fr] bg-white p-0"><img src={vehicleImages[i]} alt="" width="720" height="480" loading="lazy" className="col-span-2 aspect-[16/8] w-full object-cover" /><div className="col-span-2 grid grid-cols-[.2fr_1fr] gap-4 p-6 md:p-9"><span className="font-display text-3xl font-extrabold text-[#C6A15B]">0{i + 1}</span><div><h2 className="font-display text-2xl font-extrabold">{type}</h2><p className="mt-4 max-w-md leading-7 text-[#526978]">{t.typeLead[i]}</p><Link href="/contact?kind=quote" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#1F5B85]" data-testid={`link-solution-inquiry-${i}`}>{t.quote}<ArrowRight size={15} /></Link></div></div></article>)}</div><p className="mt-6 max-w-3xl text-xs leading-6 text-[#71838e]">{t.solutionsLead}</p></section><ContactBand t={t} /></Layout>;
}
function Mobility({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  return <Layout path="/mobility-program" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.mobilityTitle} lead={t.mobilityLead} />
    <section className="mx-auto max-w-[1280px] px-5 py-14 lg:px-12 lg:py-20"><div className="grid gap-0 md:grid-cols-3">{t.phases.map((phase, i) => <article key={phase} className="relative border-t border-[#d0dce3] px-5 py-8 first:pl-0 md:border-l md:border-t-0 md:py-5 md:first:border-l-0"><span className="font-display text-6xl font-extrabold text-[#C6A15B]">0{i + 1}</span><p className="mt-6 text-[10px] font-bold uppercase tracking-[.15em] text-[#1F5B85]">{t.phase} 0{i + 1}</p><h2 className="mt-3 max-w-[270px] font-display text-xl font-bold leading-snug">{phase}</h2></article>)}</div><div className="mt-12 border-l-2 border-[#C6A15B] bg-[#F3F6F8] p-6 md:p-8"><p className="max-w-4xl text-sm leading-7 text-[#425e71]" data-testid="text-mobility-objectives">{t.phaseNote}</p></div><div className="mt-14 grid gap-8 md:grid-cols-[.7fr_1.3fr]"><div><Eyebrow>{t.approach}</Eyebrow><h2 className="font-display text-2xl font-extrabold text-[#102A43]">{t.programmeSupportTitle}</h2></div><ul className="grid gap-4">{t.programmeSupport.map((item, i) => <li key={item} className="flex gap-4 border-t border-[#d8e1e7] py-4 text-sm leading-7 text-[#526978]"><span className="font-bold text-[#C6A15B]">0{i + 1}</span>{item}</li>)}</ul></div></section><ContactBand t={t} /></Layout>;
}
function ServiceCenter({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  return <Layout path="/service-center" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.centerTitle} lead={t.centerLead} />
    <section className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 md:grid-cols-[1fr_.8fr] md:items-center lg:px-12 lg:py-24"><div><Eyebrow>{t.project}</Eyebrow><h2 className="font-display max-w-xl text-3xl font-extrabold leading-tight">{t.centreTitle}</h2><p className="mt-5 max-w-xl leading-7 text-[#526978]">{t.centerLead}</p><p className="mt-6 border-l-2 border-[#C6A15B] pl-4 text-sm leading-6 text-[#526978]">{t.centerNote}</p><Link href="/contact" className="btn-primary mt-8" data-testid="link-service-contact">{t.talk}<ArrowRight size={16} /></Link></div><figure className="relative overflow-hidden bg-[#eaf0f4]"><img src={centreConceptImage} alt="" width="1024" height="1024" loading="lazy" className="aspect-[4/3] w-full object-cover" /><figcaption className="absolute inset-x-0 bottom-0 bg-[#102A43]/85 px-5 py-4 text-xs font-bold uppercase tracking-[.13em] text-white">{lang === 'fr' ? 'Illustration conceptuelle · projet en développement' : 'Concept illustration · project in development'}</figcaption></figure></section>
    <section className="bg-[#F3F6F8]"><div className="mx-auto grid max-w-[1280px] gap-12 px-5 py-14 md:grid-cols-2 lg:px-12 lg:py-20"><div><Eyebrow>{t.project}</Eyebrow><h2 className="font-display text-2xl font-extrabold text-[#102A43]">{t.centerServicesTitle}</h2><ul className="mt-5 grid gap-0">{t.centerServices.map((item, i) => <li key={item} className="flex gap-4 border-t border-[#d5e0e6] py-4 text-sm leading-6 text-[#526978]"><span className="font-bold text-[#C6A15B]">0{i + 1}</span>{item}</li>)}</ul></div><div><Eyebrow>{t.project}</Eyebrow><h2 className="font-display text-2xl font-extrabold text-[#102A43]">{t.centerGoalsTitle}</h2><ul className="mt-5 grid gap-0">{t.centerGoals.map((item, i) => <li key={item} className="flex gap-4 border-t border-[#d5e0e6] py-4 text-sm leading-6 text-[#526978]"><span className="font-bold text-[#1F5B85]">0{i + 1}</span>{item}</li>)}</ul></div></div></section><ContactBand t={t} /></Layout>;
}
function Partnerships({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  return <Layout path="/partnerships" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.partnerTitle} lead={t.partnerLead} />
    <section className="mx-auto grid max-w-[1280px] gap-12 px-5 py-14 lg:grid-cols-[.8fr_1.2fr] lg:px-12 lg:py-20"><div><Eyebrow>{t.partnerPrompt}</Eyebrow><h2 className="font-display text-2xl font-extrabold">{t.partnerTitle}</h2><ul className="mt-7 grid gap-0">{t.partnerTypes.map((type, i) => <li className="flex items-center gap-4 border-t border-[#d8e1e7] py-4 text-sm font-semibold" key={type}><span className="text-xs font-bold text-[#C6A15B]">0{i + 1}</span>{type}</li>)}</ul><h3 className="mt-10 font-display text-xl font-extrabold text-[#102A43]">{t.partnershipWaysTitle}</h3><ul className="mt-4 grid gap-3">{t.partnershipWays.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-[#526978]"><span className="text-[#C6A15B]">—</span>{item}</li>)}</ul></div><div className="bg-[#F3F6F8] p-5 md:p-9"><InquiryForm t={t} kindDefault="partnership" /></div></section><section className="border-t border-[#dfe6eb] bg-[#F3F6F8]"><div className="mx-auto grid max-w-[1280px] gap-8 px-5 py-12 md:grid-cols-[.75fr_1.25fr] md:items-center lg:px-12"><div><Eyebrow>{t.partnerPrompt}</Eyebrow><h2 className="font-display text-2xl font-extrabold text-[#102A43]">{t.partnersTitle}</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#526978]">{t.partnersText}</p></div><div className="grid min-h-24 place-items-center border border-dashed border-[#9eafb9] p-6 text-center text-xs font-semibold text-[#71838e]">{lang === 'fr' ? 'Espace réservé aux logos de partenaires autorisés' : 'Reserved for approved partner logos'}</div></div></section></Layout>;
}
function NewsPage({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  const { data, isLoading, isError, refetch } = useListPublishedNews();
  return <Layout path="/news" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.articlesTitle} lead={t.news} />
    <section className="mx-auto min-h-[330px] max-w-[1280px] px-5 py-12 lg:px-12 lg:py-16">{isLoading ? <div className="grid gap-5 md:grid-cols-2">{[0,1].map((x) => <div key={x} className="h-44 animate-pulse bg-[#edf1f4]" />)}</div> : isError ? <div className="flex items-center gap-3 text-sm text-[#8b3b35]" role="alert"><CircleAlert size={18} />{t.newsRetry}<button className="underline" onClick={() => refetch()} data-testid="button-news-retry">{t.retry}</button></div> : !data?.length ? <div className="border-t border-[#d6e0e6] py-10 text-[#526978]" data-testid="empty-news">{t.newsEmpty}</div> : <div className="grid gap-5 md:grid-cols-2">{data.map((article) => <Link key={article.id} href={`/news/${article.slug}`} className="group grid gap-4 border-t border-[#d6e0e6] py-6 md:grid-cols-[.35fr_1fr]" data-testid={`article-${article.id}`}>{article.imageUrl ? <img src={article.imageUrl} alt="" width="220" height="150" className="h-32 w-full object-cover md:h-36" loading="lazy" /> : <div aria-hidden="true" className="flex h-32 items-center justify-center bg-[#eaf0f4] text-[#1F5B85] md:h-36"><FileText size={27} strokeWidth={1.3} /></div>}<div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-[#8b6b2b]">{article.category}</p><h2 className="mt-3 font-display text-xl font-extrabold group-hover:text-[#1F5B85]">{article.title}</h2><p className="mt-2 text-sm leading-6 text-[#526978]">{article.excerpt}</p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#1F5B85]">{t.readArticle}<ArrowRight size={14} /></span></div></Link>)}</div>}</section></Layout>;
}
function NewsDetail({ t, lang, toggle, slug }: { t: Copy; lang: Lang; toggle: () => void; slug?: string }) {
  const { data, isLoading, isError, refetch } = useListPublishedNews();
  const article = data?.find((item) => item.slug === slug);
  return <Layout path="/news" t={t} lang={lang} toggle={toggle}><div className="mx-auto max-w-[960px] px-5 py-10 lg:px-12 lg:py-16"><Link href="/news" className="inline-flex items-center gap-2 text-sm font-bold text-[#1F5B85]" data-testid="link-back-news"><ArrowLeft size={16} />{t.nav[6]}</Link>{isLoading ? <div className="mt-10 h-56 animate-pulse bg-[#edf1f4]" /> : isError ? <p role="alert" className="mt-10 text-[#8b3b35]">{t.newsRetry} <button className="underline" onClick={() => refetch()}>{t.retry}</button></p> : article ? <article className="mt-10"><Eyebrow>{article.category}</Eyebrow><h1 className="font-display text-4xl font-extrabold leading-tight tracking-[-.04em] md:text-6xl" data-testid="article-title">{article.title}</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-[#526978]">{article.excerpt}</p>{article.imageUrl && <img src={article.imageUrl} alt={article.title} width="1200" height="640" className="mt-10 max-h-[520px] w-full object-cover" />}<div className="prose prose-slate mt-10 max-w-none whitespace-pre-wrap text-[#29465b]" data-testid="article-content">{article.content || t.noArticleContent}</div></article> : <div className="mt-10 border-t border-[#d6e0e6] py-8 text-[#526978]" data-testid="empty-article">{t.articleMissing}</div>}</div></Layout>;
}
function Privacy({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  return <Layout path="/privacy" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.policyTitle} lead={t.privacyLead} /><section className="mx-auto max-w-[900px] px-5 py-14 lg:px-12 lg:py-20"><Eyebrow>{t.confirm}</Eyebrow><h2 className="font-display text-2xl font-extrabold">{lang === 'fr' ? 'Comment les demandes sont traitées' : 'How enquiries are handled'}</h2><ul className="mt-7 grid gap-4">{t.principles.map((p, i) => <li key={p} className="flex gap-4 border-t border-[#d8e1e7] py-5 text-sm leading-7 text-[#526978]"><span className="font-bold text-[#C6A15B]">0{i + 1}</span>{p}</li>)}</ul><div className="mt-9 bg-[#F3F6F8] p-6 text-sm leading-7 text-[#526978]"><p className="font-bold text-[#102A43]">{t.confirm}</p><p className="mt-2">{lang === 'fr' ? 'Durée de conservation, base légale, responsable du traitement, prestataires techniques et modalités détaillées d’exercice des droits : éléments à confirmer par DBI avant publication définitive.' : 'Retention period, legal basis, data controller, technical providers and detailed rights procedures: information to be confirmed by DBI before final publication.'}</p></div></section></Layout>;
}
function Legal({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  return <Layout path="/legal" t={t} lang={lang} toggle={toggle}><PageHead crumb={t.crumb} title={t.legalTitle} lead={t.legalLead} /><section className="mx-auto max-w-[900px] px-5 py-14 lg:px-12 lg:py-20"><Eyebrow>{t.confirm}</Eyebrow><h2 className="font-display text-2xl font-extrabold">{t.contactDetails}</h2><p className="mt-5 text-sm leading-7 text-[#526978]">{t.crumb}<br />{t.address}<br /><a href="mailto:djibrilcisse155463@gmail.com" className="text-[#1F5B85] underline underline-offset-4">djibrilcisse155463@gmail.com</a></p><ul className="mt-8 grid gap-0">{t.legalFields.map((field) => <li key={field} className="border-t border-[#d8e1e7] py-4 text-sm text-[#526978]">{field}</li>)}</ul></section></Layout>;
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prev = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const id = user?.id ?? null;
    if (prev.current !== undefined && prev.current !== id) qc.clear();
    prev.current = id;
  }), [addListener, qc]);
  return null;
}
const appearance = {
  theme: shadcn, cssLayerName: 'clerk',
  options: { logoPlacement: 'inside' as const, logoLinkUrl: basePath || '/', logoImageUrl: `${window.location.origin}${basePath}/logo.svg` },
  variables: {
    colorPrimary: '#1F5B85', colorForeground: '#102A43', colorMutedForeground: '#526978',
    colorDanger: '#a34438', colorBackground: '#ffffff', colorInput: '#ffffff',
    colorInputForeground: '#102A43', colorNeutral: '#d8e1e8', fontFamily: 'DM Sans, sans-serif', borderRadius: '3px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-sm w-[440px] max-w-full overflow-hidden border border-[#d8e1e8]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#102A43] font-bold', headerSubtitle: 'text-[#526978]',
    socialButtonsBlockButtonText: 'text-[#102A43] font-semibold', formFieldLabel: 'text-[#29465b]',
    footerActionLink: 'text-[#1F5B85] font-semibold', footerActionText: 'text-[#526978]',
    dividerText: 'text-[#526978]', identityPreviewEditButton: 'text-[#1F5B85]',
    formFieldSuccessText: 'text-[#245d42]', alertText: 'text-[#8b3b35]',
    logoBox: 'mb-3', logoImage: 'max-h-10', socialButtonsBlockButton: 'border-[#d8e1e8] bg-white',
    formButtonPrimary: 'bg-[#102A43] hover:bg-[#1F5B85] text-white',
    formFieldInput: 'border-[#d8e1e8] bg-white text-[#102A43]', footerAction: 'text-[#526978]',
    dividerLine: 'bg-[#d8e1e8]', alert: 'bg-[#f9eded]', otpCodeFieldInput: 'border-[#d8e1e8] text-[#102A43]',
    formFieldRow: 'text-[#29465b]', main: 'text-[#102A43]',
  },
};
function SignInPage({ lang, toggle }: { lang: Lang; toggle: () => void }) {
  return <div className="relative flex min-h-[100dvh] items-center justify-center bg-[#F3F6F8] px-4 py-10"><button className="absolute right-5 top-5 text-xs font-bold text-[#1F5B85]" onClick={toggle} data-testid="button-auth-language">{lang === 'fr' ? 'EN' : 'FR'}</button><div className="w-full max-w-[500px]"><div className="mb-8 text-center"><div className="inline-flex"><Brand /></div><p className="mt-5 text-sm text-[#526978]">{copy[lang].signInHelp}</p></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div></div>;
}
function SignUpPage({ lang, toggle }: { lang: Lang; toggle: () => void }) {
  return <div className="relative flex min-h-[100dvh] items-center justify-center bg-[#F3F6F8] px-4 py-10"><button className="absolute right-5 top-5 text-xs font-bold text-[#1F5B85]" onClick={toggle} data-testid="button-auth-language">{lang === 'fr' ? 'EN' : 'FR'}</button><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

type AdminTab = 'inquiries' | 'articles';
function AdminPage({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [tab, setTab] = useState<AdminTab>('inquiries');
  if (!isLoaded) return <AdminFrame t={t} lang={lang} toggle={toggle}><div className="p-10" data-testid="admin-loading">{t.loading}</div></AdminFrame>;
  if (!isSignedIn) return <AdminFrame t={t} lang={lang} toggle={toggle}><div className="mx-auto max-w-xl px-5 py-16 text-center"><ShieldCheck size={38} className="mx-auto text-[#C6A15B]" /><h1 className="mt-5 font-display text-3xl font-extrabold">{t.admin}</h1><p className="mt-4 text-sm leading-7 text-[#526978]">{t.signInHelp}</p><Link href="/sign-in" className="btn-primary mt-7" data-testid="link-admin-signin">{t.signIn}<ArrowRight size={16} /></Link></div></AdminFrame>;
  return <AdminAuthorized t={t} lang={lang} toggle={toggle} tab={tab} setTab={setTab} signOut={() => signOut({ redirectUrl: basePath || '/' })} />;
}
function AdminFrame({ children, t, lang, toggle }: { children: ReactNode; t: Copy; lang: Lang; toggle: () => void }) {
  return <div className="min-h-[100dvh] bg-[#F3F6F8]"><header className="flex items-center justify-between border-b border-[#d8e1e7] bg-white px-5 py-4 lg:px-10"><Brand /><div className="flex items-center gap-5"><button onClick={toggle} className="text-xs font-bold text-[#1F5B85]" data-testid="button-admin-language">{lang === 'fr' ? 'EN' : 'FR'}</button><Link href="/" className="flex items-center gap-2 text-xs font-bold text-[#1F5B85]" data-testid="link-admin-home">{t.backHome}<ArrowUpRight size={14} /></Link></div></header>{children}</div>;
}
function AdminAuthorized({ t, lang, toggle, tab, setTab, signOut }: { t: Copy; lang: Lang; toggle: () => void; tab: AdminTab; setTab: (tab: AdminTab) => void; signOut: () => void }) {
  const identity = useGetAdminIdentity({ query: { enabled: true, queryKey: getGetAdminIdentityQueryKey(), retry: false } });
  const { data, isLoading, isError, refetch } = identity;
  return <AdminFrame t={t} lang={lang} toggle={toggle}>{isLoading ? <div className="p-10" data-testid="admin-identity-loading">{t.loading}</div> : isError ? <div className="mx-auto max-w-xl px-5 py-16 text-center"><CircleAlert className="mx-auto text-[#a34438]" size={32} /><h1 className="mt-4 font-display text-2xl font-bold">{t.adminError}</h1><button className="btn-outline mt-6" onClick={() => refetch()} data-testid="button-admin-retry">{t.retry}</button></div> : !data?.isAdmin ? <div className="mx-auto max-w-xl px-5 py-16 text-center"><ShieldCheck size={38} className="mx-auto text-[#C6A15B]" /><h1 className="mt-5 font-display text-3xl font-extrabold">{t.notAdmin}</h1><p className="mt-4 text-sm leading-7 text-[#526978]">{t.adminSetup}</p><button className="btn-outline mt-7" onClick={signOut} data-testid="button-admin-signout">{t.signOut}</button></div> : <AdminDashboard t={t} lang={lang} tab={tab} setTab={setTab} signOut={signOut} email={data.email} />}</AdminFrame>;
}
function AdminDashboard({ t, lang, tab, setTab, signOut, email }: { t: Copy; lang: Lang; tab: AdminTab; setTab: (tab: AdminTab) => void; signOut: () => void; email: string }) {
  const overview = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey() } });
  return <div className="mx-auto max-w-[1440px] px-4 py-8 md:px-8 lg:px-12 lg:py-12"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><Eyebrow>{t.adminDesc}</Eyebrow><h1 className="font-display text-3xl font-extrabold tracking-[-.04em] md:text-4xl">{t.admin}</h1><p className="mt-2 text-sm text-[#657986]" data-testid="text-admin-email">{email}</p></div><button className="btn-outline self-start !py-2.5 text-xs" onClick={signOut} data-testid="button-admin-signout">{t.signOut}</button></div>
    {overview.isError && <p className="mt-5 flex items-center gap-3 text-sm text-[#8b3b35]" role="alert">{t.adminError}<button className="underline" onClick={() => overview.refetch()} data-testid="button-overview-retry">{t.retry}</button></p>}
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[t.total, overview.data?.totalInquiries], [t.newOnes, overview.data?.newInquiries], [t.published, overview.data?.publishedArticles], [t.drafts, overview.data?.draftArticles]].map(([label, value], i) => <div key={String(label)} className="bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#71838e]">{label}</p><p className="mt-3 font-display text-3xl font-extrabold text-[#102A43]" data-testid={`admin-metric-${i}`}>{overview.isLoading ? '—' : value ?? '—'}</p></div>)}</div>
    <div className="mt-9 border-b border-[#d3dde3]"><div className="flex gap-6"><button onClick={() => setTab('inquiries')} className={`border-b-2 px-1 py-4 text-sm font-bold ${tab === 'inquiries' ? 'border-[#C6A15B] text-[#102A43]' : 'border-transparent text-[#71838e]'}`} data-testid="tab-inquiries">{t.inquiries}</button><button onClick={() => setTab('articles')} className={`border-b-2 px-1 py-4 text-sm font-bold ${tab === 'articles' ? 'border-[#C6A15B] text-[#102A43]' : 'border-transparent text-[#71838e]'}`} data-testid="tab-articles">{t.articles}</button></div></div>
    {tab === 'inquiries' ? <InquiryManager t={t} lang={lang} /> : <ArticleManager t={t} lang={lang} />}
  </div>;
}
function InquiryManager({ t, lang }: { t: Copy; lang: Lang }) {
  const qc = useQueryClient();
  const query = useListAdminInquiries({ query: { queryKey: getListAdminInquiriesQueryKey() } });
  const update = useUpdateAdminInquiry();
  const [mutationError, setMutationError] = useState(false);
  const setStatus = (id: number, status: 'new' | 'in_progress' | 'closed') => update.mutate({ id, data: { status } }, {
    onSuccess: () => { setMutationError(false); qc.invalidateQueries({ queryKey: getListAdminInquiriesQueryKey() }); qc.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }); },
    onError: () => setMutationError(true),
  });
  if (query.isLoading) return <div className="py-10 text-sm text-[#526978]">{t.loading}</div>;
  if (query.isError) return <div className="flex items-center gap-3 py-10 text-sm text-[#8b3b35]" role="alert">{t.inboxErr}<button className="underline" onClick={() => query.refetch()} data-testid="button-inquiries-retry">{t.retry}</button></div>;
  if (!query.data?.length) return <div className="py-14 text-center text-sm text-[#526978]" data-testid="empty-inquiries">{t.noInquiries}</div>;
  return <div className="mt-5">{mutationError && <p className="mb-4 text-sm text-[#8b3b35]" role="alert" data-testid="status-inquiry-update-error">{t.formError}</p>}<div className="overflow-x-auto bg-white"><table className="admin-table w-full min-w-[850px]"><thead><tr><th>{t.formName}</th><th>{t.kind}</th><th>{t.message}</th><th>{t.statusLabel}</th><th>{t.statusLabel}</th></tr></thead><tbody>{query.data.map((item) => <tr key={item.id} data-testid={`inquiry-row-${item.id}`}><td><p className="font-bold text-[#102A43]">{item.name}</p><a className="mt-1 block text-xs text-[#1F5B85] underline" href={`mailto:${item.email}`}>{item.email}</a>{item.company && <p className="mt-1 text-xs text-[#71838e]">{item.company}</p>}<p className="mt-1 text-[10px] text-[#71838e]">{new Date(item.createdAt).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB')}</p></td><td className="text-sm">{t.kinds[item.kind]}</td><td className="max-w-sm whitespace-pre-wrap text-sm leading-6 text-[#526978]">{item.message}</td><td><span className="rounded-sm bg-[#eaf0f4] px-2 py-1 text-xs font-bold text-[#1F5B85]">{t.status[item.status]}</span></td><td><select aria-label={`${t.statusLabel}: ${item.name}`} className="field !w-auto !py-2 text-xs" value={item.status} disabled={update.isPending} onChange={(e) => setStatus(item.id, e.target.value as 'new' | 'in_progress' | 'closed')} data-testid={`select-inquiry-status-${item.id}`}><option value="new">{t.status.new}</option><option value="in_progress">{t.status.in_progress}</option><option value="closed">{t.status.closed}</option></select></td></tr>)}</tbody></table></div></div>;
}

const blankArticle = (): NewsInput => ({ title: '', slug: '', excerpt: '', content: '', category: '', imageUrl: '', status: 'draft' });
function ArticleManager({ t, lang }: { t: Copy; lang: Lang }) {
  const qc = useQueryClient();
  const query = useListAdminNews({ query: { queryKey: getListAdminNewsQueryKey() } });
  const create = useCreateAdminNews();
  const update = useUpdateAdminNews();
  const remove = useDeleteAdminNews();
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NewsInput>(blankArticle());
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const busy = create.isPending || update.isPending;
  const startCreate = () => { setForm(blankArticle()); setEditing(null); setError(''); setOk(''); setCreating(true); };
  const startEdit = (item: NewsItem) => { setForm({ title: item.title, slug: item.slug, excerpt: item.excerpt, content: item.content, category: item.category, imageUrl: item.imageUrl ?? '', status: item.status }); setEditing(item); setCreating(true); setError(''); setOk(''); };
  const patch = (key: keyof NewsInput, value: string) => setForm((state) => ({ ...state, [key]: value } as NewsInput));
  const persist = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setOk('');
    const data: NewsInput = { ...form, imageUrl: form.imageUrl || null };
    if (editing) update.mutate({ id: editing.id, data: data as NewsUpdate }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAdminNewsQueryKey() }); qc.invalidateQueries({ queryKey: getListPublishedNewsQueryKey() }); qc.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }); setCreating(false); setOk(lang === 'fr' ? 'Article mis à jour.' : 'Article updated.'); }, onError: () => setError(lang === 'fr' ? 'La mise à jour a échoué.' : 'The update failed.') });
    else create.mutate({ data }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAdminNewsQueryKey() }); qc.invalidateQueries({ queryKey: getListPublishedNewsQueryKey() }); qc.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }); setCreating(false); setOk(lang === 'fr' ? 'Article créé.' : 'Article created.'); }, onError: () => setError(lang === 'fr' ? 'La création a échoué.' : 'Article creation failed.') });
  };
  const deleteArticle = (item: NewsItem) => {
    if (!window.confirm(t.deleteConfirm)) return;
    setError(''); remove.mutate({ id: item.id }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getListAdminNewsQueryKey() }); qc.invalidateQueries({ queryKey: getListPublishedNewsQueryKey() }); qc.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() }); setOk(lang === 'fr' ? 'Article supprimé.' : 'Article deleted.'); }, onError: () => setError(lang === 'fr' ? 'La suppression a échoué.' : 'Deletion failed.') });
  };
  if (query.isLoading) return <div className="py-10 text-sm text-[#526978]">{t.loading}</div>;
  if (query.isError) return <div className="py-10 text-sm text-[#8b3b35]" role="alert">{t.articleError}<button className="ml-2 underline" onClick={() => query.refetch()} data-testid="button-articles-retry">{t.retry}</button></div>;
  return <div className="mt-6">
    <div className="flex flex-wrap items-center justify-between gap-4">{ok && <p className="text-sm text-[#245d42]" role="status" data-testid="status-article-success">{ok}</p>}{error && <p className="text-sm text-[#8b3b35]" role="alert" data-testid="status-article-error">{error}</p>}<button className="btn-primary ml-auto !py-2.5 text-xs" onClick={startCreate} data-testid="button-create-article"><Plus size={15} />{t.createArticle}</button></div>
    {creating && <form onSubmit={persist} className="mt-5 grid gap-4 border border-[#d8e1e7] bg-white p-5 md:grid-cols-2 md:p-7" data-testid="form-article">
      {([[t.title, 'title'], [t.slug, 'slug'], [t.category, 'category'], [t.imageUrl, 'imageUrl']] as const).map(([label, key]) => <div key={key}><label className="mb-2 block text-xs font-bold" htmlFor={`article-${key}`}>{label}</label><input id={`article-${key}`} required={key !== 'imageUrl'} maxLength={key === 'imageUrl' ? 2048 : undefined} className="field" value={form[key] ?? ''} onChange={(e) => patch(key, e.target.value)} data-testid={`input-article-${key}`} /></div>)}
      <div><label className="mb-2 block text-xs font-bold" htmlFor="article-status">{t.statusLabel}</label><select id="article-status" className="field" value={form.status} onChange={(e) => patch('status', e.target.value)} data-testid="select-article-status"><option value="draft">{t.state.draft}</option><option value="published">{t.state.published}</option></select></div>
      <div className="md:col-span-2"><label className="mb-2 block text-xs font-bold" htmlFor="article-excerpt">{t.excerpt}</label><textarea id="article-excerpt" required minLength={10} maxLength={500} className="field min-h-24" value={form.excerpt} onChange={(e) => patch('excerpt', e.target.value)} data-testid="textarea-article-excerpt" /></div>
      <div className="md:col-span-2"><label className="mb-2 block text-xs font-bold" htmlFor="article-content">{t.content}</label><textarea id="article-content" required minLength={10} maxLength={20000} className="field min-h-48" value={form.content} onChange={(e) => patch('content', e.target.value)} data-testid="textarea-article-content" /></div>
      <div className="flex gap-3 md:col-span-2"><button className="btn-primary !py-2.5 text-xs" disabled={busy} type="submit" data-testid="button-save-article">{busy ? t.loading : t.save}<Check size={14} /></button><button className="btn-outline !py-2.5 text-xs" type="button" onClick={() => setCreating(false)} data-testid="button-cancel-article">{t.cancel}</button></div>
    </form>}
    {!query.data?.length ? <div className="py-14 text-center text-sm text-[#526978]" data-testid="empty-admin-articles">{t.noArticles}</div> : <div className="mt-5 grid gap-3">{query.data.map((item) => <article key={item.id} className="flex flex-col justify-between gap-4 border border-[#d8e1e7] bg-white p-5 md:flex-row md:items-center" data-testid={`admin-article-${item.id}`}><div><span className={`text-[10px] font-bold uppercase tracking-[.15em] ${item.status === 'published' ? 'text-[#245d42]' : 'text-[#8b6b2b]'}`}>{t.state[item.status]}</span><h2 className="mt-2 font-display text-lg font-extrabold">{item.title}</h2><p className="mt-1 text-xs text-[#71838e]">{item.category} · {item.slug}</p></div><div className="flex gap-2"><button className="btn-outline !px-3 !py-2 text-xs" onClick={() => startEdit(item)} data-testid={`button-edit-article-${item.id}`}><PenLine size={14} />{t.edit}</button><button className="inline-flex items-center gap-2 border border-[#e5c9c4] px-3 py-2 text-xs font-bold text-[#8b3b35] hover:bg-[#f9eded]" disabled={remove.isPending} onClick={() => deleteArticle(item)} data-testid={`button-delete-article-${item.id}`}><Trash2 size={14} />{t.delete}</button></div></article>)}</div>}
  </div>;
}

function HomeRoute({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  const { isSignedIn, isLoaded } = useUser();
  if (isLoaded && isSignedIn) return <Redirect to="/admin" />;
  return <Home t={t} lang={lang} toggle={toggle} />;
}
function Router({ t, lang, toggle }: { t: Copy; lang: Lang; toggle: () => void }) {
  const [path] = useLocation();
  return <ErrorBoundary resetKey={path}><Switch>
    <Route path="/" component={() => <HomeRoute t={t} lang={lang} toggle={toggle} />} />
    <Route path="/about" component={() => <About t={t} lang={lang} toggle={toggle} />} />
    <Route path="/solutions" component={() => <Solutions t={t} lang={lang} toggle={toggle} />} />
    <Route path="/mobility-program" component={() => <Mobility t={t} lang={lang} toggle={toggle} />} />
    <Route path="/service-center" component={() => <ServiceCenter t={t} lang={lang} toggle={toggle} />} />
    <Route path="/partnerships" component={() => <Partnerships t={t} lang={lang} toggle={toggle} />} />
    <Route path="/news/:slug" component={(params) => <NewsDetail t={t} lang={lang} toggle={toggle} slug={params.params.slug} />} />
    <Route path="/news" component={() => <NewsPage t={t} lang={lang} toggle={toggle} />} />
    <Route path="/contact" component={() => <Contact t={t} lang={lang} toggle={toggle} />} />
    <Route path="/privacy" component={() => <Privacy t={t} lang={lang} toggle={toggle} />} />
    <Route path="/legal" component={() => <Legal t={t} lang={lang} toggle={toggle} />} />
    <Route path="/admin" component={() => <AdminPage t={t} lang={lang} toggle={toggle} />} />
    <Route path="/sign-in/*?" component={() => <SignInPage lang={lang} toggle={toggle} />} />
    <Route path="/sign-up/*?" component={() => <SignUpPage lang={lang} toggle={toggle} />} />
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}
function ClerkRoutes() {
  const [, setLocation] = useLocation();
  const { t, lang, toggle } = useLang();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={appearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={lang === 'fr' ? {
      signIn: { start: { title: 'Connexion à votre espace', subtitle: 'Accédez à l’administration DBI' } },
      signUp: { start: { title: 'Créer un compte', subtitle: 'Les accès administrateur sont attribués par DBI' } },
    } : {
      signIn: { start: { title: 'Sign in to your account', subtitle: 'Access DBI administration' } },
      signUp: { start: { title: 'Create an account', subtitle: 'Administrator access is granted by DBI' } },
    }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <QueryClientProvider client={queryClient}><TooltipProvider><ClerkCacheInvalidator /><Router t={t} lang={lang} toggle={toggle} /><Toaster /></TooltipProvider></QueryClientProvider>
  </ClerkProvider>;
}
function App() {
  return <WouterRouter base={basePath}><ClerkRoutes /></WouterRouter>;
}
export default App;
