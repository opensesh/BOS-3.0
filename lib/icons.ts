/**
 * Unified Icon System
 * 
 * Combines Lucide icons (general UI) with Font Awesome brand icons (brand logos).
 * This gives users access to icons like Google Drive, Slack, etc.
 */

import * as LucideIcons from 'lucide-react';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  // Productivity & Collaboration
  faGoogle,
  faGoogleDrive,
  faSlack,
  faFigma,
  faGithub,
  faDiscord,
  faTrello,
  faJira,
  faConfluence,
  faAtlassian,
  faDropbox,
  faMicrosoft,
  
  // Social Media
  faTwitter,
  faXTwitter,
  faLinkedin,
  faFacebook,
  faInstagram,
  faTiktok,
  faYoutube,
  faWhatsapp,
  faTelegram,
  faSnapchat,
  faPinterest,
  faReddit,
  faMedium,
  
  // Development & Tech
  faGitlab,
  faBitbucket,
  faGit,
  faNpm,
  faDocker,
  faAws,
  faReact,
  faVuejs,
  faAngular,
  faNodeJs,
  faPython,
  faJs,
  faHtml5,
  faCss3Alt,
  faStackOverflow,
  faCodepen,
  faBootstrap,
  faWordpress,
  faPhp,
  faRust,
  faGolang,
  faSwift,
  faJava,
  faLinux,
  faUbuntu,
  faWindows,
  faApple,
  faAndroid,
  faLaravel,
  
  // Music & Entertainment
  faSpotify,
  faSoundcloud,
  faTwitch,
  faSteam,
  faPlaystation,
  faXbox,
  
  // E-commerce & Business
  faShopify,
  faStripe,
  faPaypal,
  faAmazon,
  faEbay,
  faEtsy,
  faSalesforce,
  faHubspot,
  faMailchimp,
  
  // Browsers
  faChrome,
  faFirefoxBrowser,
  faSafari,
  faEdge,
  faOpera,
  
  // Design
  faSketch,
  faDribbble,
  faBehance,
  
  // Other Popular
  faAppStoreIos,
  faGooglePlay,
  faProductHunt,
  faKickstarter,
  faPatreon,
} from '@fortawesome/free-brands-svg-icons';

// Type for Lucide icon
export type LucideIcon = keyof typeof LucideIcons;

// Font Awesome brand icons with metadata
export interface FABrandIcon {
  name: string;
  icon: IconDefinition;
  keywords: string[]; // For search
}

export const FA_BRAND_ICONS: FABrandIcon[] = [
  // Productivity & Collaboration
  { name: 'fa-google', icon: faGoogle, keywords: ['google', 'search', 'alphabet'] },
  { name: 'fa-google-drive', icon: faGoogleDrive, keywords: ['google', 'drive', 'storage', 'cloud', 'docs'] },
  { name: 'fa-slack', icon: faSlack, keywords: ['slack', 'chat', 'messaging', 'team', 'communication'] },
  { name: 'fa-discord', icon: faDiscord, keywords: ['discord', 'chat', 'gaming', 'community', 'voice'] },
  { name: 'fa-figma', icon: faFigma, keywords: ['figma', 'design', 'prototype', 'ui', 'ux'] },
  { name: 'fa-trello', icon: faTrello, keywords: ['trello', 'kanban', 'project', 'board', 'tasks'] },
  { name: 'fa-jira', icon: faJira, keywords: ['jira', 'tickets', 'agile', 'sprint', 'issues'] },
  { name: 'fa-confluence', icon: faConfluence, keywords: ['confluence', 'wiki', 'documentation', 'atlassian'] },
  { name: 'fa-atlassian', icon: faAtlassian, keywords: ['atlassian', 'jira', 'confluence', 'trello'] },
  { name: 'fa-dropbox', icon: faDropbox, keywords: ['dropbox', 'storage', 'cloud', 'files', 'sync'] },
  { name: 'fa-microsoft', icon: faMicrosoft, keywords: ['microsoft', 'office', 'windows', 'teams', 'azure'] },
  
  // Social Media
  { name: 'fa-twitter', icon: faTwitter, keywords: ['twitter', 'social', 'tweet', 'x'] },
  { name: 'fa-x-twitter', icon: faXTwitter, keywords: ['x', 'twitter', 'social', 'tweet'] },
  { name: 'fa-linkedin', icon: faLinkedin, keywords: ['linkedin', 'professional', 'network', 'jobs', 'career'] },
  { name: 'fa-facebook', icon: faFacebook, keywords: ['facebook', 'social', 'meta', 'network'] },
  { name: 'fa-instagram', icon: faInstagram, keywords: ['instagram', 'photos', 'social', 'stories', 'reels'] },
  { name: 'fa-tiktok', icon: faTiktok, keywords: ['tiktok', 'video', 'social', 'short', 'viral'] },
  { name: 'fa-youtube', icon: faYoutube, keywords: ['youtube', 'video', 'streaming', 'content'] },
  { name: 'fa-whatsapp', icon: faWhatsapp, keywords: ['whatsapp', 'messaging', 'chat', 'meta'] },
  { name: 'fa-telegram', icon: faTelegram, keywords: ['telegram', 'messaging', 'chat', 'secure'] },
  { name: 'fa-snapchat', icon: faSnapchat, keywords: ['snapchat', 'social', 'photos', 'stories'] },
  { name: 'fa-pinterest', icon: faPinterest, keywords: ['pinterest', 'boards', 'inspiration', 'pins'] },
  { name: 'fa-reddit', icon: faReddit, keywords: ['reddit', 'community', 'forum', 'social'] },
  { name: 'fa-medium', icon: faMedium, keywords: ['medium', 'blog', 'articles', 'writing'] },
  
  // Development & Tech
  { name: 'fa-github', icon: faGithub, keywords: ['github', 'code', 'repository', 'git', 'version'] },
  { name: 'fa-gitlab', icon: faGitlab, keywords: ['gitlab', 'code', 'repository', 'ci', 'devops'] },
  { name: 'fa-bitbucket', icon: faBitbucket, keywords: ['bitbucket', 'code', 'repository', 'atlassian'] },
  { name: 'fa-git', icon: faGit, keywords: ['git', 'version', 'control', 'source'] },
  { name: 'fa-npm', icon: faNpm, keywords: ['npm', 'packages', 'node', 'javascript'] },
  { name: 'fa-docker', icon: faDocker, keywords: ['docker', 'container', 'devops', 'deploy'] },
  { name: 'fa-aws', icon: faAws, keywords: ['aws', 'amazon', 'cloud', 'hosting', 'services'] },
  { name: 'fa-react', icon: faReact, keywords: ['react', 'javascript', 'frontend', 'framework'] },
  { name: 'fa-vuejs', icon: faVuejs, keywords: ['vue', 'javascript', 'frontend', 'framework'] },
  { name: 'fa-angular', icon: faAngular, keywords: ['angular', 'javascript', 'frontend', 'google'] },
  { name: 'fa-nodejs', icon: faNodeJs, keywords: ['node', 'javascript', 'backend', 'server'] },
  { name: 'fa-python', icon: faPython, keywords: ['python', 'programming', 'language', 'data'] },
  { name: 'fa-js', icon: faJs, keywords: ['javascript', 'js', 'programming', 'web'] },
  { name: 'fa-html5', icon: faHtml5, keywords: ['html', 'markup', 'web', 'frontend'] },
  { name: 'fa-css3', icon: faCss3Alt, keywords: ['css', 'styles', 'web', 'frontend'] },
  { name: 'fa-bootstrap', icon: faBootstrap, keywords: ['bootstrap', 'css', 'framework', 'frontend'] },
  { name: 'fa-php', icon: faPhp, keywords: ['php', 'programming', 'backend', 'web'] },
  { name: 'fa-rust', icon: faRust, keywords: ['rust', 'programming', 'systems', 'language'] },
  { name: 'fa-golang', icon: faGolang, keywords: ['go', 'golang', 'programming', 'google'] },
  { name: 'fa-swift', icon: faSwift, keywords: ['swift', 'apple', 'ios', 'programming'] },
  { name: 'fa-java', icon: faJava, keywords: ['java', 'programming', 'jvm', 'enterprise'] },
  { name: 'fa-laravel', icon: faLaravel, keywords: ['laravel', 'php', 'framework', 'backend'] },
  { name: 'fa-stack-overflow', icon: faStackOverflow, keywords: ['stackoverflow', 'questions', 'programming', 'help'] },
  { name: 'fa-codepen', icon: faCodepen, keywords: ['codepen', 'frontend', 'demo', 'code'] },
  { name: 'fa-wordpress', icon: faWordpress, keywords: ['wordpress', 'cms', 'blog', 'website'] },
  
  // Design
  { name: 'fa-sketch', icon: faSketch, keywords: ['sketch', 'design', 'ui', 'mac'] },
  { name: 'fa-behance', icon: faBehance, keywords: ['behance', 'portfolio', 'design', 'adobe'] },
  { name: 'fa-dribbble', icon: faDribbble, keywords: ['dribbble', 'design', 'portfolio', 'showcase'] },
  
  // Music & Entertainment
  { name: 'fa-spotify', icon: faSpotify, keywords: ['spotify', 'music', 'streaming', 'podcast'] },
  { name: 'fa-soundcloud', icon: faSoundcloud, keywords: ['soundcloud', 'music', 'audio', 'streaming'] },
  { name: 'fa-twitch', icon: faTwitch, keywords: ['twitch', 'streaming', 'gaming', 'live'] },
  { name: 'fa-steam', icon: faSteam, keywords: ['steam', 'gaming', 'games', 'valve'] },
  { name: 'fa-playstation', icon: faPlaystation, keywords: ['playstation', 'gaming', 'sony', 'console'] },
  { name: 'fa-xbox', icon: faXbox, keywords: ['xbox', 'gaming', 'microsoft', 'console'] },
  { name: 'fa-apple', icon: faApple, keywords: ['apple', 'mac', 'iphone', 'ios'] },
  
  // E-commerce & Business
  { name: 'fa-shopify', icon: faShopify, keywords: ['shopify', 'ecommerce', 'store', 'sell'] },
  { name: 'fa-stripe', icon: faStripe, keywords: ['stripe', 'payments', 'billing', 'subscriptions'] },
  { name: 'fa-paypal', icon: faPaypal, keywords: ['paypal', 'payments', 'money', 'transfer'] },
  { name: 'fa-amazon', icon: faAmazon, keywords: ['amazon', 'ecommerce', 'shopping', 'aws'] },
  { name: 'fa-ebay', icon: faEbay, keywords: ['ebay', 'auction', 'marketplace', 'shopping'] },
  { name: 'fa-etsy', icon: faEtsy, keywords: ['etsy', 'handmade', 'marketplace', 'crafts'] },
  { name: 'fa-salesforce', icon: faSalesforce, keywords: ['salesforce', 'crm', 'sales', 'cloud'] },
  { name: 'fa-hubspot', icon: faHubspot, keywords: ['hubspot', 'marketing', 'crm', 'sales'] },
  { name: 'fa-mailchimp', icon: faMailchimp, keywords: ['mailchimp', 'email', 'marketing', 'newsletter'] },
  { name: 'fa-product-hunt', icon: faProductHunt, keywords: ['producthunt', 'launch', 'startup', 'product'] },
  { name: 'fa-kickstarter', icon: faKickstarter, keywords: ['kickstarter', 'crowdfunding', 'startup'] },
  { name: 'fa-patreon', icon: faPatreon, keywords: ['patreon', 'creators', 'subscription', 'support'] },
  
  // Browsers & OS
  { name: 'fa-chrome', icon: faChrome, keywords: ['chrome', 'browser', 'google', 'web'] },
  { name: 'fa-firefox', icon: faFirefoxBrowser, keywords: ['firefox', 'browser', 'mozilla', 'web'] },
  { name: 'fa-safari', icon: faSafari, keywords: ['safari', 'browser', 'apple', 'mac'] },
  { name: 'fa-edge', icon: faEdge, keywords: ['edge', 'browser', 'microsoft', 'web'] },
  { name: 'fa-opera', icon: faOpera, keywords: ['opera', 'browser', 'web'] },
  { name: 'fa-android', icon: faAndroid, keywords: ['android', 'mobile', 'google', 'phone'] },
  { name: 'fa-app-store-ios', icon: faAppStoreIos, keywords: ['appstore', 'ios', 'apple', 'apps'] },
  { name: 'fa-google-play', icon: faGooglePlay, keywords: ['googleplay', 'android', 'apps', 'store'] },
  { name: 'fa-windows', icon: faWindows, keywords: ['windows', 'microsoft', 'os', 'pc'] },
  { name: 'fa-linux', icon: faLinux, keywords: ['linux', 'os', 'open source', 'server'] },
  { name: 'fa-ubuntu', icon: faUbuntu, keywords: ['ubuntu', 'linux', 'os', 'open source'] },
];

// Get all Lucide icon names (filter properly)
export function getAllLucideIconNames(): string[] {
  return Object.keys(LucideIcons).filter(
    (key) => 
      !key.endsWith('Icon') && 
      key !== 'createLucideIcon' && 
      key !== 'default' &&
      key !== 'icons' &&
      /^[A-Z]/.test(key)
  ).sort();
}

// Search icons by query - returns both Lucide and FA results
export function searchIcons(query: string): { lucide: string[]; fontAwesome: FABrandIcon[] } {
  const normalizedQuery = query.toLowerCase().trim();
  
  if (!normalizedQuery) {
    return { lucide: [], fontAwesome: [] };
  }
  
  // Search Lucide icons
  const lucideResults = getAllLucideIconNames().filter(name => 
    name.toLowerCase().includes(normalizedQuery)
  );
  
  // Search Font Awesome brand icons (by name and keywords)
  const faResults = FA_BRAND_ICONS.filter(icon => 
    icon.name.toLowerCase().includes(normalizedQuery) ||
    icon.keywords.some(keyword => keyword.includes(normalizedQuery))
  );
  
  return { lucide: lucideResults, fontAwesome: faResults };
}

// Popular icons for quick access (mixed Lucide + FA brands)
export const POPULAR_ICONS = {
  lucide: [
    'Globe', 'Mail', 'MessageSquare', 'Phone', 'MapPin', 'Calendar',
    'Clock', 'Heart', 'Star', 'Bookmark', 'Tag', 'Share2',
    'Link', 'Download', 'Upload', 'File', 'Folder', 'Image',
    'Video', 'Music', 'Mic', 'Camera', 'Settings', 'User',
    'Building', 'Home', 'Package', 'CreditCard', 'TrendingUp', 'BarChart',
  ],
  fontAwesome: [
    'fa-google-drive', 'fa-slack', 'fa-figma', 'fa-github',
    'fa-discord', 'fa-linkedin', 'fa-twitter', 'fa-instagram', 'fa-youtube',
    'fa-spotify', 'fa-dropbox', 'fa-trello', 'fa-chrome', 'fa-react',
  ],
};

// Check if an icon name is a Font Awesome icon
export function isFontAwesomeIcon(iconName: string): boolean {
  return iconName.startsWith('fa-');
}

// Get FA icon definition by name
export function getFAIconByName(name: string): IconDefinition | null {
  const icon = FA_BRAND_ICONS.find(i => i.name === name);
  return icon?.icon || null;
}
