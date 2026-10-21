// Original, consistent inline SVG icon primitives; no external assets or dependencies.
const paths={
today:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18M8 15h3"/>',
tasks:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/>',
projects:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M8 5V3h8v2"/>',
paths:'<path d="M4 19V7l6-4 5 4 5-2v12l-5 4-5-4-6 2Z"/><path d="M10 3v14M15 7v14"/>',
friends:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/>',
profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
play:'<path d="m8 5 11 7-11 7V5Z"/>',
pause:'<path d="M8 5v14M16 5v14"/>',
check:'<path d="m4 12 5 5L20 6"/>',
trash:'<path d="M4 7h16M10 3h4M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
back:'<path d="m12 19-7-7 7-7M5 12h14"/>',
bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>',
coin:'<circle cx="12" cy="12" r="9"/><path d="M9 9.5c0-2.7 6-2.7 6 0s-6 1-6 4 6 2.7 6 0M12 5v14"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
activity:'<path d="M3 12h4l3-7 4 14 3-7h4"/>',
cloud:'<path d="M7 18h11a4 4 0 0 0 .2-8A7 7 0 0 0 5 10a4 4 0 0 0 2 8Z"/>',
search:'<circle cx="10" cy="10" r="7"/><path d="m15.5 15.5 5 5"/>',
settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>',
download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
logout:'<path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5M16 17l5-5-5-5M21 12H9"/>',
shield:'<path d="m12 2 8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/>'
};
export function icon(name, label=''){
 const path=paths[name]||paths.target;
 return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+path+'</svg>'+(label?'<span class="sr-only">'+String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</span>':'');
}
export const CATEGORIES=['📚 Learning','💪 Fitness','🎨 Creativity','💻 Work','💖 Life','🌎 Adventure'];
export const categoryNames={'📚 Learning':'Learning','💪 Fitness':'Fitness','🎨 Creativity':'Creativity','💻 Work':'Work','💖 Life':'Life','🌎 Adventure':'Adventure'};
export const categoryLabel=value=>categoryNames[value]||String(value||'General').replace(/^[^A-Za-z0-9]+/u,'').trim();
export const categoryMark=value=>({Learning:'LR',Fitness:'FT',Creativity:'CR',Work:'WK',Life:'LF',Adventure:'AD'})[categoryLabel(value)]||'XP';
