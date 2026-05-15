var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/// <reference types="@figma/plugin-typings" />
import { TOKENS } from "./design-tokens";
import { hexToRgb, createBadge, getFontStyle } from "./layout-utils";
import { loadFonts, getLoadedFigtreeSemibold } from "./load-fonts";
import { createOutcomeCardSections, mapExperimentDataToOutcomeData, } from "./experiment-outcome-card";
import { EXPERIMENT_STATUS_STYLES, formatDateForDisplay, getExperimentTypeLabel, } from "./experiment-card-shared";
const ROLLED_OUT_BADGE_BG = "#fffbb5";
const ROLLED_OUT_BADGE_TEXT = "#484122";
const TROPHY_ICON_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none">
  <path d="M6 9H4.5a1 1 0 0 1 0-5H6" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 9h1.5a1 1 0 0 0 0-5H18" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 22h16" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" stroke="${ROLLED_OUT_BADGE_TEXT}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
function createRolledOutIcon() {
    const icon = figma.createNodeFromSvg(TROPHY_ICON_SVG);
    icon.name = "Rolled Out Icon";
    icon.resize(10, 10);
    icon.fills = [];
    return icon;
}
// Brand icon SVG markup (complete SVGs for figma.createNodeFromSvg)
const BRAND_SVGS = {
    // Official Figma multi-color logo (same paths as plugin UI `brandIcons.figma`)
    figma: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z" fill="#0ACF83"/>
    <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z" fill="#A259FF"/>
    <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z" fill="#F24E1E"/>
    <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" fill="#FF7262"/>
    <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z" fill="#1ABCFE"/>
  </svg>`,
    // Miro multi-color logo
    miro: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1113_19461)">
    <path d="M0.375977 5.18795C0.375977 2.53035 2.53041 0.375916 5.18801 0.375916H14.8121C17.4697 0.375916 19.6241 2.53035 19.6241 5.18795V14.812C19.6241 17.4696 17.4697 19.624 14.8121 19.624H5.18801C2.53041 19.624 0.375977 17.4696 0.375977 14.812V5.18795Z" fill="#FFDD33"/>
    <path d="M13.1725 4.0451H11.4252L12.8813 6.60345L9.67791 4.0451H7.93062L9.53235 7.17202L6.18333 4.0451H4.43604L6.18333 8.02533L4.43604 15.985H6.18333L9.53235 7.45668L7.93062 15.985H9.67791L12.8813 6.88811L11.4252 15.985H13.1725L16.3759 6.0348L13.1725 4.0451Z" fill="black"/>
    </g>
    <defs>
    <clipPath id="clip0_1113_19461">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Jira multi-color logo
    jira: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1113_19457)">
    <path d="M18.7713 0.375916H9.52686C9.52684 0.923938 9.63476 1.4666 9.84447 1.97291C10.0542 2.47922 10.3616 2.93926 10.7491 3.32677C11.1366 3.71429 11.5966 4.02167 12.1029 4.23138C12.6093 4.44109 13.1519 4.54902 13.6999 4.549H15.4029V6.19321C15.4044 8.49584 17.2706 10.3622 19.5732 10.3637V1.17787C19.5732 0.735089 19.2143 0.375916 18.7713 0.375916Z" fill="#2684FF"/>
    <path d="M14.1972 4.98212H4.95288C4.95431 7.28475 6.82055 9.15106 9.12326 9.15257H10.8262V10.802C10.8291 13.1047 12.6966 14.9697 14.9993 14.9697V5.78422C14.9993 5.34129 14.6402 4.98212 14.1972 4.98212Z" fill="url(#paint0_linear_1113_19457)"/>
    <path d="M9.62041 9.58563H0.375977C0.375977 11.8904 2.2444 13.7587 4.54906 13.7587H6.25733V15.4029C6.25883 17.7034 8.12184 19.5689 10.4224 19.5732V10.3877C10.4224 9.94473 10.0633 9.58563 9.62041 9.58563Z" fill="url(#paint1_linear_1113_19457)"/>
    </g>
    <defs>
    <linearGradient id="paint0_linear_1113_19457" x1="989.811" y1="6.59013" x2="598.957" y2="414.429" gradientUnits="userSpaceOnUse">
    <stop offset="0.18" stop-color="#0052CC"/>
    <stop offset="1" stop-color="#2684FF"/>
    </linearGradient>
    <linearGradient id="paint1_linear_1113_19457" x1="1011.7" y1="14.13" x2="559.584" y2="458.957" gradientUnits="userSpaceOnUse">
    <stop offset="0.18" stop-color="#0052CC"/>
    <stop offset="1" stop-color="#2684FF"/>
    </linearGradient>
    <clipPath id="clip0_1113_19457">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Notion multi-color logo
    notion: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1113_19464)">
    <path d="M1.94896 1.18981L12.5963 0.403478C13.9041 0.291247 14.2402 0.366931 15.0625 0.964701L18.4613 3.35909C19.0219 3.77082 19.2085 3.88312 19.2085 4.33146V17.4629C19.2085 18.2859 18.9096 18.7726 17.8635 18.8471L5.49917 19.5956C4.71407 19.6328 4.34018 19.5205 3.92903 18.9965L1.42622 15.742C0.977303 15.143 0.79126 14.6946 0.79126 14.1705V2.4983C0.79126 1.82549 1.09018 1.26427 1.94896 1.18981Z" fill="white"/>
    <path d="M12.5963 0.403478L1.94896 1.18981C1.09018 1.26427 0.79126 1.82549 0.79126 2.4983V14.1706C0.79126 14.6946 0.977231 15.143 1.42622 15.742L3.92903 18.9965C4.34018 19.5205 4.71407 19.6328 5.49917 19.5956L17.8635 18.8471C18.909 18.7726 19.2085 18.2859 19.2085 17.4629V4.33146C19.2085 3.90621 19.0405 3.78369 18.5459 3.42067L18.4607 3.35909L15.0625 0.964701C14.2402 0.366931 13.9042 0.291247 12.5963 0.403478ZM5.77881 4.11657C4.76925 4.18456 4.54025 4.19995 3.96687 3.73362L2.50896 2.57398C2.36076 2.42391 2.43514 2.23657 2.80845 2.19938L13.044 1.45154C13.9035 1.3765 14.3512 1.676 14.6873 1.93772L16.4428 3.20966C16.5178 3.24743 16.7045 3.47132 16.48 3.47132L5.90968 4.10758L5.77881 4.11657ZM4.60184 17.3507V6.20305C4.60184 5.71621 4.75126 5.49175 5.19896 5.45391L17.3395 4.74319C17.7513 4.706 17.9373 4.96765 17.9373 5.45391V16.5271C17.9373 17.0139 17.8622 17.4256 17.19 17.4629L5.57227 18.1364C4.90011 18.1736 4.60184 17.9497 4.60184 17.3507ZM16.0702 6.80074C16.1446 7.13751 16.0702 7.47427 15.7334 7.51276L15.1735 7.62369V15.8542C14.6873 16.1159 14.2396 16.2653 13.8656 16.2653C13.2679 16.2653 13.1184 16.078 12.6707 15.5174L9.00896 9.75636V15.3302L10.1672 15.5925C10.1672 15.5925 10.1672 16.266 9.23277 16.266L6.65622 16.4154C6.58119 16.2653 6.65622 15.8914 6.91738 15.817L7.59011 15.6303V8.26067L6.6563 8.18499C6.58119 7.8483 6.76781 7.36204 7.29126 7.3242L10.0557 7.13823L13.8656 12.9737V7.8111L12.8946 7.69945C12.8195 7.287 13.1184 6.98751 13.4917 6.95096L16.0702 6.80074Z" fill="black"/>
    </g>
    <defs>
    <clipPath id="clip0_1113_19464">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Amplitude multi-color logo
    amplitude: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1113_19449)">
    <path d="M10 0.375916C15.3145 0.375916 19.6241 4.68546 19.6241 9.99998C19.6241 15.3145 15.3145 19.624 10 19.624C4.68553 19.624 0.375977 15.3183 0.375977 9.99998C0.375977 4.68163 4.68553 0.375916 10 0.375916ZM8.72846 3.31727C7.54184 3.3211 6.46733 5.23043 5.54357 8.98734C4.89041 8.9796 4.29132 8.96802 3.73086 8.96028H3.6459C3.57628 8.95637 3.50673 8.96028 3.4371 8.96802C3.12019 9.02592 2.89214 9.30426 2.89214 9.62509C2.89214 9.95366 3.13568 10.2358 3.46034 10.286L3.46801 10.2937H5.24214C5.08006 11.0268 4.93701 11.764 4.81312 12.5046L4.75898 12.8176V12.8331C4.75904 12.9072 4.77785 12.9801 4.81366 13.0449C4.84947 13.1098 4.90112 13.1646 4.9638 13.2041C5.16868 13.3355 5.44312 13.2737 5.57455 13.0688L5.58613 13.0804L6.45575 10.2937H10.6455C10.9663 11.5073 11.2987 12.7558 11.7394 13.9308C11.9751 14.5608 12.5239 16.0295 13.4439 16.0373H13.4555C14.8778 16.0373 15.4344 13.7375 15.8015 12.2147C15.8827 11.8861 15.9484 11.604 16.0141 11.3952L16.0412 11.3103L16.0451 11.2977C16.0752 11.1891 16.0138 11.0731 15.9059 11.0358C15.7938 10.9972 15.6663 11.0552 15.6276 11.1711L15.5967 11.2561C15.4769 11.5924 15.3648 11.9055 15.2643 12.1876L15.2566 12.2108C14.6382 13.954 14.3599 14.7502 13.8072 14.7502H13.7724C13.0651 14.7502 12.4041 11.8823 12.1528 10.8039C12.1103 10.6184 12.0717 10.4445 12.033 10.2937H16.5939C16.6751 10.2937 16.7562 10.2744 16.8297 10.2358L16.8332 10.2328C16.8383 10.2296 16.8436 10.2268 16.849 10.2242L16.8721 10.2087L16.8837 10.201C16.8954 10.1932 16.907 10.1855 16.9185 10.1739L16.9356 10.1598C17.0194 10.0869 17.0787 9.98524 17.104 9.88013C17.1621 9.60569 16.9804 9.33516 16.706 9.2811H16.6827C16.6557 9.27719 16.6325 9.27336 16.6055 9.27336L16.5359 9.26562C14.9242 9.14968 13.266 9.10321 11.7084 9.07238L11.7045 9.06073C10.9509 6.2199 10.0038 3.31727 8.72846 3.31727ZM8.67816 4.59659C8.74387 4.59659 8.80575 4.63524 8.85981 4.70486C8.99124 4.91351 9.22312 5.38118 9.56718 6.41704C9.80289 7.12825 10.058 8.01328 10.3285 9.0414C9.30049 9.02599 8.26462 9.01434 7.25966 9.00276L6.74951 8.99892C7.32545 6.74945 8.025 5.04494 8.53898 4.64298C8.58154 4.61592 8.62793 4.59659 8.67816 4.59659Z" fill="#10069F"/>
    </g>
    <defs>
    <clipPath id="clip0_1113_19449">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Asana multi-color logo
    asana: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1115_19572)">
    <path d="M15.6504 10.5289C13.2481 10.5289 11.3008 12.4763 11.3008 14.8787C11.3008 17.281 13.2481 19.2284 15.6504 19.2284C18.0527 19.2284 20 17.2809 20 14.8787C20 12.4763 18.0527 10.5289 15.6504 10.5289ZM4.34961 10.5293C1.94742 10.5293 0 12.4763 0 14.8787C0 17.281 1.94742 19.2284 4.34961 19.2284C6.75195 19.2284 8.69945 17.2809 8.69945 14.8787C8.69945 12.4763 6.75195 10.5293 4.34961 10.5293ZM14.3496 5.0918C14.3496 7.49414 12.4022 9.4418 10.0001 9.4418C7.59773 9.4418 5.65039 7.49414 5.65039 5.0918C5.65039 2.68969 7.59766 0.742188 10 0.742188C12.4021 0.742188 14.3495 2.68984 14.3495 5.09172" fill="#F06A6A"/>
    </g>
    <defs>
    <clipPath id="clip0_1115_19572">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Linear multi-color logo
    linear: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1115_19567)">
    <path d="M0.638554 8.01664L11.9833 19.3614C12.1489 19.527 12.069 19.8083 11.8388 19.8512C11.4509 19.9237 11.0591 19.9732 10.6653 19.9994C10.6233 20.002 10.5813 19.9957 10.5419 19.9807C10.5026 19.9658 10.4669 19.9426 10.4372 19.9127L0.0872257 9.56273C0.0573626 9.53308 0.0341831 9.49738 0.0192404 9.45804C0.00429778 9.4187 -0.00206276 9.37661 0.000585065 9.33461C0.0271476 8.93656 0.0769913 8.545 0.14871 8.16117C0.191679 7.93094 0.472929 7.85102 0.638554 8.01664ZM0.318866 12.6101C0.243085 12.3277 0.576679 12.1496 0.783397 12.3563L7.64355 19.2166C7.85035 19.4233 7.67223 19.7568 7.38988 19.6811C3.95004 18.7588 1.24121 16.05 0.318866 12.6101ZM1.31308 5.01281C1.40941 4.84602 1.63707 4.82039 1.77324 4.95664L15.0434 18.2266C15.1796 18.3628 15.1541 18.5905 14.9871 18.6868C14.7055 18.8494 14.4161 18.9981 14.12 19.1325C14.0082 19.1833 13.877 19.1577 13.7903 19.0708L0.929101 6.20992C0.842304 6.12305 0.816679 5.99195 0.867382 5.88016C1.00179 5.58402 1.15056 5.29461 1.31316 5.01297M9.98902 0C15.5179 0 20 4.48203 20 10.0109C20 12.9461 18.7368 15.5861 16.7245 17.4172C16.6083 17.523 16.4301 17.5159 16.319 17.4049L2.59504 3.68094C2.48402 3.56984 2.47707 3.39164 2.58269 3.27547C4.41387 1.26312 7.05394 0 9.98902 0Z" fill="#222326"/>
    </g>
    <defs>
    <clipPath id="clip0_1115_19567">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Slack multi-color logo
    slack: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_1115_19560)">
<path d="M4.20634 12.6032C4.20634 13.7619 3.26985 14.6985 2.1111 14.6985C0.952353 14.6985 0.0158691 13.7619 0.0158691 12.6032C0.0158691 11.4445 0.952354 10.508 2.11118 10.508H4.20626L4.20634 12.6032ZM5.25399 12.6032C5.25399 11.4445 6.19048 10.508 7.34923 10.508C8.50798 10.508 9.44446 11.4445 9.44446 12.6032V17.8413C9.44446 19 8.50798 19.9366 7.34915 19.9366C6.19056 19.9366 5.25399 19 5.25399 17.8413V12.6032Z" fill="#E01E5A"/>
<path d="M7.34922 4.19047C6.19047 4.19047 5.25391 3.25398 5.25391 2.09523C5.25391 0.936485 6.19055 0 7.34922 0C8.50789 0 9.44445 0.936485 9.44445 2.09523V4.19055L7.34922 4.19047ZM7.34922 5.25398C8.50797 5.25398 9.44445 6.19047 9.44445 7.34922C9.44445 8.50797 8.50797 9.44445 7.34914 9.44445H2.09531C0.936484 9.44445 0 8.50797 0 7.34914C0 6.19055 0.936485 5.25398 2.09523 5.25398H7.34922Z" fill="#36C5F0"/>
<path d="M15.7462 7.34922C15.7462 6.19047 16.6827 5.25391 17.8413 5.25391C19 5.25391 19.9366 6.19047 19.9366 7.34922C19.9366 8.50797 19.0001 9.44445 17.8413 9.44445H15.7462V7.34922ZM14.6985 7.34922C14.6985 8.50797 13.762 9.44445 12.6032 9.44445C11.4445 9.44445 10.5081 8.50797 10.5081 7.34914V2.09531C10.5081 0.936484 11.4445 0 12.6032 0C13.7619 0 14.6984 0.936485 14.6984 2.09523L14.6985 7.34922Z" fill="#2EB67D"/>
<path d="M12.6032 15.7461C13.762 15.7461 14.6985 16.6826 14.6985 17.8413C14.6985 18.9999 13.762 19.9366 12.6032 19.9366C11.4445 19.9366 10.5081 19 10.5081 17.8413V15.7461H12.6032ZM12.6032 14.6985C11.4445 14.6985 10.5081 13.7619 10.5081 12.6032C10.5081 11.4445 11.4445 10.508 12.6033 10.508H17.8572C19.0159 10.508 19.9525 11.4445 19.9525 12.6032C19.9525 13.762 19.0159 14.6985 17.8572 14.6985H12.6032Z" fill="#ECB22E"/>
</g>
<defs>
<clipPath id="clip0_1115_19560">
<rect width="20" height="20" fill="white"/>
</clipPath>
</defs>
</svg>`,
    // Github multi-color logo
    github: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1115_19565)">
    <path d="M10.0001 0.234375C4.47789 0.234375 0 4.71149 0 10.2345C0 14.6527 2.86531 18.4013 6.83867 19.7235C7.33844 19.8161 7.52195 19.5066 7.52195 19.2424C7.52195 19.004 7.51258 18.2163 7.50836 17.3807C4.72633 17.9855 4.1393 16.2008 4.1393 16.2008C3.68438 15.0449 3.02891 14.7375 3.02891 14.7375C2.12164 14.1169 3.09734 14.1297 3.09734 14.1297C4.10148 14.2002 4.63023 15.1602 4.63023 15.1602C5.52219 16.6889 6.96969 16.247 7.54031 15.9914C7.63008 15.3452 7.88922 14.9039 8.17523 14.6542C5.95406 14.4014 3.61914 13.5439 3.61914 9.71219C3.61914 8.62039 4.00977 7.72828 4.64945 7.02797C4.54563 6.77609 4.20336 5.75906 4.74633 4.38156C4.74633 4.38156 5.58609 4.11281 7.49711 5.40664C8.29477 5.18508 9.15023 5.07398 10.0001 5.07016C10.8499 5.07398 11.7061 5.185 12.5052 5.40664C14.4139 4.11289 15.2525 4.38164 15.2525 4.38164C15.7968 5.75898 15.4544 6.77617 15.3505 7.02797C15.9917 7.72828 16.3797 8.62039 16.3797 9.71219C16.3797 13.553 14.0403 14.3988 11.8135 14.6463C12.1722 14.9566 12.4918 15.5652 12.4918 16.4982C12.4918 17.8362 12.4802 18.913 12.4802 19.2424C12.4802 19.5086 12.6602 19.8204 13.1671 19.7221C17.1383 18.3984 20 14.6513 20 10.2345C20 4.71148 15.5227 0.234375 10.0001 0.234375ZM3.74539 14.4797C3.72336 14.5294 3.64516 14.5443 3.57398 14.5102C3.50141 14.4776 3.4607 14.4098 3.48414 14.36C3.5057 14.3088 3.58406 14.2945 3.65641 14.3288C3.72906 14.3615 3.77047 14.4298 3.74539 14.4797ZM4.23727 14.9186C4.18961 14.9628 4.09633 14.9423 4.03305 14.8724C3.96766 14.8027 3.95539 14.7095 4.00375 14.6646C4.05297 14.6204 4.14336 14.6411 4.20891 14.7108C4.27438 14.7813 4.28703 14.8739 4.23727 14.9186ZM4.57477 15.4802C4.51344 15.5227 4.41328 15.4828 4.35133 15.3939C4.29008 15.305 4.29008 15.1984 4.35266 15.1556C4.41477 15.1129 4.51344 15.1513 4.57617 15.2396C4.63727 15.33 4.63727 15.4366 4.57469 15.4802M5.14531 16.1306C5.09055 16.1911 4.97375 16.1748 4.88828 16.0923C4.80086 16.0117 4.77656 15.8973 4.83156 15.8369C4.88703 15.7763 5.00445 15.7933 5.09055 15.8752C5.17727 15.9556 5.20383 16.0709 5.14531 16.1306ZM5.88297 16.3502C5.85875 16.4285 5.74625 16.4641 5.63305 16.4309C5.51992 16.3966 5.44594 16.3048 5.46875 16.2257C5.49227 16.1468 5.60523 16.1098 5.7193 16.1454C5.83227 16.1795 5.90648 16.2705 5.88297 16.3502M6.72234 16.4434C6.72516 16.5259 6.62914 16.5942 6.51023 16.5958C6.3907 16.5984 6.29391 16.5317 6.29258 16.4505C6.29258 16.3673 6.38648 16.2995 6.50609 16.2975C6.625 16.2952 6.72234 16.3614 6.72234 16.4434ZM7.54695 16.4118C7.56117 16.4923 7.47859 16.5749 7.36047 16.597C7.24445 16.6181 7.13695 16.5684 7.12219 16.4887C7.10781 16.4062 7.19195 16.3235 7.30781 16.3022C7.42609 16.2816 7.53187 16.33 7.54695 16.4118Z" fill="#161614"/>
    </g>
    <defs>
    <clipPath id="clip0_1115_19565">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Confluence multi-color logo
    confluence: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1115_19569)">
    <path d="M0.723337 15.0258C0.517087 15.3623 0.28529 15.7528 0.0884932 16.0639C0.00381874 16.207 -0.0213396 16.3776 0.0184246 16.539C0.0581888 16.7005 0.159702 16.8399 0.301149 16.9273L4.42795 19.4669C4.49966 19.5112 4.57947 19.5407 4.66273 19.5539C4.74599 19.567 4.83102 19.5634 4.91288 19.5433C4.99473 19.5232 5.07176 19.487 5.13948 19.4368C5.20721 19.3867 5.26426 19.3235 5.30732 19.251C5.4724 18.9748 5.68505 18.6161 5.91677 18.232C7.55162 15.5337 9.19599 15.8639 12.1609 17.2796L16.2528 19.2256C16.3295 19.2621 16.4127 19.2828 16.4976 19.2866C16.5825 19.2903 16.6672 19.277 16.7469 19.2474C16.8265 19.2178 16.8994 19.1725 16.9612 19.1142C17.023 19.056 17.0725 18.9859 17.1067 18.9082L19.0717 14.4639C19.1384 14.3114 19.1425 14.1387 19.0832 13.9831C19.0238 13.8276 18.9057 13.7015 18.7543 13.6322C17.8908 13.2259 16.1735 12.4164 14.6275 11.6704C9.06584 8.96894 4.33904 9.14354 0.723337 15.0258Z" fill="url(#paint0_linear_1115_19569)"/>
    <path d="M19.2277 4.93999C19.4341 4.60351 19.6658 4.21304 19.8627 3.90194C19.9473 3.75883 19.9725 3.58822 19.9327 3.42676C19.8929 3.26531 19.7914 3.1259 19.6499 3.03851L15.5231 0.498896C15.4509 0.450245 15.3694 0.416981 15.2837 0.401171C15.1981 0.385362 15.1101 0.387345 15.0252 0.406998C14.9404 0.426651 14.8605 0.463554 14.7905 0.51541C14.7205 0.567266 14.662 0.632967 14.6185 0.708427C14.4534 0.984599 14.2407 1.34335 14.0089 1.72741C12.3741 4.42569 10.7297 4.09561 7.76478 2.67976L3.68564 0.743349C3.60893 0.706846 3.52568 0.686106 3.44082 0.682358C3.35595 0.67861 3.2712 0.69193 3.19157 0.721528C3.11195 0.751127 3.03908 0.796402 2.97727 0.854674C2.91546 0.912945 2.86597 0.983028 2.83173 1.06077L0.866652 5.50507C0.79995 5.65762 0.795843 5.83028 0.855216 5.98583C0.914588 6.14138 1.03269 6.26739 1.18407 6.33671C2.04751 6.74311 3.76493 7.55257 5.31087 8.29858C10.8852 10.9969 15.612 10.8159 19.2277 4.93999" fill="url(#paint1_linear_1115_19569)"/>
    </g>
    <defs>
    <linearGradient id="paint0_linear_1115_19569" x1="1896.04" y1="1088.8" x2="1433.9" y2="28.5991" gradientUnits="userSpaceOnUse">
    <stop offset="0.18" stop-color="#0052CC"/>
    <stop offset="1" stop-color="#2684FF"/>
    </linearGradient>
    <linearGradient id="paint1_linear_1115_19569" x1="18.535" y1="-120.198" x2="481.407" y2="940.513" gradientUnits="userSpaceOnUse">
    <stop offset="0.18" stop-color="#0052CC"/>
    <stop offset="1" stop-color="#2684FF"/>
    </linearGradient>
    <clipPath id="clip0_1115_19569">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
   </svg>`,
    // Trello multi-color logo
    trello: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1115_19574)">
    <path d="M18.0469 0H1.95312C0.874444 0 0 0.874444 0 1.95312V18.0469C0 19.1256 0.874444 20 1.95312 20H18.0469C19.1256 20 20 19.1256 20 18.0469V1.95312C20 0.874444 19.1256 0 18.0469 0Z" fill="url(#paint0_linear_1115_19574)"/>
    <path d="M16.4625 2.59998H12.2375C11.7198 2.59998 11.3 3.01971 11.3 3.53748V10.4125C11.3 10.9302 11.7198 11.35 12.2375 11.35H16.4625C16.9803 11.35 17.4 10.9302 17.4 10.4125V3.53748C17.4 3.01971 16.9803 2.59998 16.4625 2.59998Z" fill="white"/>
    <path d="M7.7626 2.59998H3.5376C3.01983 2.59998 2.6001 3.01971 2.6001 3.53748V15.4125C2.6001 15.9302 3.01983 16.35 3.5376 16.35H7.7626C8.28037 16.35 8.7001 15.9302 8.7001 15.4125V3.53748C8.7001 3.01971 8.28037 2.59998 7.7626 2.59998Z" fill="white"/>
    </g>
    <defs>
    <linearGradient id="paint0_linear_1115_19574" x1="1000" y1="0" x2="1000" y2="2000" gradientUnits="userSpaceOnUse">
    <stop stop-color="#0091E6"/>
    <stop offset="1" stop-color="#0079BF"/>
    </linearGradient>
    <clipPath id="clip0_1115_19574">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Monday multi-color logo
    monday: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_1115_19585)">
    <path d="M2.48798 15.8976C2.04585 15.8985 1.6114 15.7821 1.229 15.5602C0.846601 15.3383 0.529956 15.0188 0.311413 14.6345C0.0962033 14.2529 -0.0111295 13.8199 0.000912539 13.3819C0.0129545 12.944 0.143918 12.5176 0.379772 12.1483L4.86204 5.10958C5.09144 4.73129 5.41715 4.42066 5.80589 4.20945C6.19464 3.99824 6.63248 3.894 7.07469 3.9074C7.51657 3.91797 7.9477 4.04577 8.32397 4.2777C8.70023 4.50964 9.00811 4.83738 9.2161 5.2274C9.63399 6.01747 9.58173 6.96802 9.08133 7.70974L4.60188 14.7484C4.37474 15.1024 4.0619 15.3933 3.69237 15.5942C3.32284 15.7951 2.90857 15.8994 2.48798 15.8976Z" fill="#F62B54"/>
    <path d="M10.1761 15.8975C9.27207 15.8975 8.4402 15.4142 8.00333 14.6374C7.78859 14.2568 7.6815 13.825 7.69354 13.3882C7.70558 12.9513 7.83631 12.5261 8.07168 12.1579L12.5454 5.13525C12.7715 4.75164 13.096 4.43549 13.4854 4.21961C13.8749 4.00372 14.3149 3.89597 14.76 3.90752C15.6717 3.92744 16.4979 4.43736 16.9157 5.2351C17.1196 5.62572 17.2124 6.06482 17.1839 6.50456C17.1555 6.94429 17.0069 7.36777 16.7543 7.72885L12.2814 14.7514C12.055 15.1039 11.7434 15.3936 11.3755 15.594C11.0075 15.7943 10.5951 15.8986 10.1761 15.8975Z" fill="#FFCC00"/>
    <path d="M17.6927 15.9564C18.9671 15.9564 20.0003 14.9449 20.0003 13.6972C20.0003 12.4495 18.9671 11.438 17.6927 11.438C16.4182 11.438 15.385 12.4495 15.385 13.6972C15.385 14.9449 16.4182 15.9564 17.6927 15.9564Z" fill="#00CA72"/>
    </g>
    <defs>
    <clipPath id="clip0_1115_19585">
    <rect width="20" height="20" fill="white"/>
    </clipPath>
    </defs>
  </svg>`,
    // Generic link icon
    generic: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.33331 10.8333C8.69119 11.3118 9.14778 11.7077 9.6721 11.9941C10.1964 12.2806 10.7762 12.4509 11.3722 12.4936C11.9681 12.5363 12.5663 12.4503 13.1261 12.2415C13.6859 12.0327 14.1942 11.7059 14.6166 11.2833L17.1166 8.78335C17.8756 7.9975 18.2956 6.94499 18.2861 5.85251C18.2766 4.76002 17.8384 3.71497 17.0659 2.94243C16.2934 2.1699 15.2483 1.7317 14.1558 1.7222C13.0633 1.71271 12.0108 2.13269 11.225 2.89168L9.79165 4.31668" stroke="#333B47" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11.6667 9.16665C11.3088 8.68821 10.8522 8.29233 10.3279 8.00587C9.80353 7.7194 9.22373 7.54905 8.62777 7.50637C8.03182 7.46369 7.43366 7.54968 6.87386 7.7585C6.31406 7.96732 5.80572 8.29409 5.38332 8.71665L2.88332 11.2167C2.12432 12.0025 1.70435 13.055 1.71384 14.1475C1.72334 15.24 2.16154 16.285 2.93407 17.0576C3.70661 17.8301 4.75166 18.2683 5.84415 18.2778C6.93663 18.2873 7.98914 17.8673 8.77498 17.1083L10.2 15.6833" stroke="#333B47" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};
/**
 * Create a brand icon as a Figma frame from SVG
 * @param brand - Brand name (figma, miro, jira, generic)
 * @param size - Icon size in pixels (default 14)
 * @returns FrameNode containing the vector icon
 */
function createBrandIconVector(brand, size = 14) {
    const brandLower = brand.toLowerCase();
    const svgMarkup = BRAND_SVGS[brandLower] || BRAND_SVGS.generic;
    try {
        // Create node from SVG - this returns a FrameNode with vectors inside
        const svgNode = figma.createNodeFromSvg(svgMarkup);
        svgNode.name = `${brand} Icon`;
        // Scale to target size (SVG is 24x24)
        const scale = size / 16;
        svgNode.resize(size, size);
        // Flatten to clean up the structure
        svgNode.fills = [];
        return svgNode;
    }
    catch (e) {
        console.error(`Failed to create SVG icon for ${brand}:`, e);
        // Fallback: create empty frame
        const fallback = figma.createFrame();
        fallback.name = `${brand} Icon (fallback)`;
        fallback.resize(size, size);
        fallback.fills = [];
        return fallback;
    }
}
/**
 * Creates a comprehensive Experiment Info Card displaying experiment metadata and resources
 *
 * Card layout: Two-panel design
 * - Left panel (60%): Experiment header, description, metrics summary, and details
 * - Right panel (40%): Resource links (Figma, Jira, Miro, Notion, etc.)
 *
 * Features:
 * - Status badge (running, completed, failed, etc.) with color coding
 * - Experiment name and description
 * - Optional outcome card if variants data provided
 * - Metric definitions and calculations
 * - Responsive link section with brand logos
 * - Auto layout with proper spacing and alignment
 *
 * @param experimentName - Title of the experiment
 * @param description - Experiment description/hypothesis
 * @param figmaLink - Link to Figma design file
 * @param jiraLink - Link to Jira ticket
 * @param miroLink - Link to Miro board
 * @param notionLink - Link to Notion doc
 * @param amplitudeLink - Link to Amplitude analytics
 * @param asanaLink - Link to Asana project
 * @param LinearLink - Link to Linear issue
 * @param SlackLink - Link to Slack channel
 * @param GithubLink - Link to GitHub PR/repo
 * @param ConfluenceLink - Link to Confluence page
 * @param TrelloLink - Link to Trello board
 * @param MondayLink - Link to Monday.com board
 * @param ClickupLink - Link to ClickUp task
 * @param genericLinks - Array of custom links
 * @param metrics - Metric definitions for outcome card
 * @param status - Experiment status: 'running' | 'completed' | 'failed' | 'paused'
 * @param options - Optional configuration (variants, owner, audience, dates, etc.)
 * @returns Promise<FrameNode> containing the complete info card
 *
 * @example
 * const infoCard = await createExperimentInfoCard(
 *   'Pricing Page Button Color Experiment',
 *   'Testing whether CTA color changes help more visitors start checkout',
 *   'https://figma.com/...',
 *   'https://jira.com/...',
 *   // ... other links
 *   metrics,
 *   'running',
 *   { variants: variantList, owner: 'Alice' }
 * );
 */
export function createExperimentInfoCard(experimentName_1) {
    return __awaiter(this, arguments, void 0, function* (experimentName, description = "", figmaLink = "", jiraLink = "", miroLink = "", notionLink = "", amplitudeLink = "", asanaLink = "", LinearLink = "", SlackLink = "", GithubLink = "", ConfluenceLink = "", TrelloLink = "", MondayLink = "", ClickupLink = "", genericLinks = [], metrics, status = 'running', options) {
        var _a;
        // Ensure all fonts are loaded before creating any text nodes
        yield loadFonts();
        // Container
        const card = figma.createFrame();
        card.name = `Experiment Overview`;
        card.layoutMode = "VERTICAL";
        card.counterAxisSizingMode = "AUTO";
        card.primaryAxisSizingMode = "AUTO";
        card.itemSpacing = 24;
        card.paddingLeft = card.paddingRight = 32;
        card.paddingTop = card.paddingBottom = 32;
        card.cornerRadius = 24;
        card.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
        card.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
        card.strokeWeight = 1;
        card.effects = [];
        card.minWidth = 792;
        card.minHeight = 612;
        const CONTENT_MIN_WIDTH = 728;
        const CONTENT_MAX_WIDTH = 1400;
        const CARD_MAX_WIDTH = 1800;
        const statusConfig = EXPERIMENT_STATUS_STYLES[status] || EXPERIMENT_STATUS_STYLES.running;
        // === SECTION 1: HEADER (Badge row + Name + Description) ===
        const headerSection = yield createStoryHeaderWithBadges(experimentName, description || "", statusConfig, options);
        card.appendChild(headerSection);
        // === SINGLE-COLUMN CONTENT FLOW ===
        const contentStack = figma.createFrame();
        contentStack.name = "Content Flow";
        contentStack.layoutMode = "VERTICAL";
        contentStack.counterAxisSizingMode = "FIXED";
        contentStack.primaryAxisSizingMode = "AUTO";
        contentStack.layoutAlign = "STRETCH";
        contentStack.itemSpacing = 24;
        contentStack.fills = [];
        contentStack.strokes = [];
        contentStack.minWidth = CONTENT_MIN_WIDTH;
        const summaryHost = figma.createFrame();
        summaryHost.name = "Summary Host";
        summaryHost.layoutMode = "VERTICAL";
        summaryHost.counterAxisSizingMode = "FIXED";
        summaryHost.primaryAxisSizingMode = "AUTO";
        summaryHost.layoutAlign = "STRETCH";
        summaryHost.fills = [];
        summaryHost.strokes = [];
        summaryHost.minWidth = CONTENT_MIN_WIDTH;
        // === OVERVIEW SECTION ===
        const overviewData = [];
        // Name - always show (hidden)
        // overviewData.push({ 
        //   label: 'Name', 
        //   value: experimentName || 'Untitled Experiment'
        // });
        // Description - always show
        overviewData.push({
            label: 'Description',
            value: description || '—'
        });
        // Audience - show if present, and not already in overviewData
        if ((options === null || options === void 0 ? void 0 : options.audience) && !overviewData.some(row => row.label === 'Audience')) {
            overviewData.push({
                label: 'Audience',
                value: options.audience
            });
        }
        // Sample Size - show if present, and not already in overviewData
        if ((options === null || options === void 0 ? void 0 : options.totalSampleSize) !== undefined && options.totalSampleSize !== null && !overviewData.some(row => row.label === 'Sample Size')) {
            overviewData.push({
                label: 'Sample Size',
                value: options.totalSampleSize.toLocaleString()
            });
        }
        // Hypothesis - hidden
        // overviewData.push({ 
        //   label: 'Hypothesis', 
        //   value: options?.hypothesis || '—' 
        // });
        // Type - hidden
        // overviewData.push({ 
        //   label: 'Type', 
        //   value: options?.experimentType ? getExperimentTypeLabel(options.experimentType) : '—' 
        // });
        // Dates - always show
        // Parse YYYY-MM-DD as local date to avoid timezone day shifts.
        function parseDateLocal(dateString) {
            if (!dateString)
                return null;
            const isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/;
            const match = dateString.match(isoDateOnly);
            if (match) {
                const year = Number(match[1]);
                const month = Number(match[2]) - 1;
                const day = Number(match[3]);
                return new Date(year, month, day);
            }
            const parsed = new Date(dateString);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        }
        function formatUIDate(dateString) {
            const date = parseDateLocal(dateString);
            if (!date)
                return '';
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        let dateValue = '—';
        if ((options === null || options === void 0 ? void 0 : options.startDate) && (options === null || options === void 0 ? void 0 : options.endDate)) {
            const start = parseDateLocal(options.startDate);
            const end = parseDateLocal(options.endDate);
            if (start && end) {
                dateValue = `${formatUIDate(options.startDate)} → ${formatUIDate(options.endDate)}`;
            }
            else {
                dateValue = `${options.startDate} – ${options.endDate}`;
            }
        }
        else if (options === null || options === void 0 ? void 0 : options.startDate) {
            const start = parseDateLocal(options.startDate);
            dateValue = start ? formatUIDate(options.startDate) : options.startDate;
        }
        else if (options === null || options === void 0 ? void 0 : options.endDate) {
            const end = parseDateLocal(options.endDate);
            dateValue = end ? formatUIDate(options.endDate) : options.endDate;
        }
        overviewData.push({
            label: 'Dates',
            value: dateValue
        });
        // Owner - always show
        overviewData.push({
            label: 'Owner',
            value: (options === null || options === void 0 ? void 0 : options.owner) || '—'
        });
        // (Audience and Sample Size are now only added above Dates)
        // Create Overview section
        try {
            yield appendDetailsSection(summaryHost, 'Summary', overviewData);
        }
        catch (e) {
            console.error('Error creating overview section:', e);
        }
        // === RESOURCES SECTION ===
        // Always show Resources section, even if no links (show placeholder)
        const linksSection = createResourcesSection(figmaLink, jiraLink, miroLink, notionLink, amplitudeLink, asanaLink, LinearLink, SlackLink, GithubLink, ConfluenceLink, TrelloLink, MondayLink, ClickupLink, genericLinks);
        card.appendChild(contentStack);
        summaryHost.layoutAlign = "STRETCH";
        contentStack.appendChild(summaryHost);
        // (Targeting section removed)
        const shouldShowInlineOutcome = (options === null || options === void 0 ? void 0 : options.showOutcomeCard) === true &&
            !!(options === null || options === void 0 ? void 0 : options.variants) &&
            options.variants.length > 0 &&
            !!metrics &&
            metrics.length > 0;
        if (shouldShowInlineOutcome) {
            try {
                const outcomeData = mapExperimentDataToOutcomeData(experimentName, metrics, options.variants, {
                    hypothesis: options === null || options === void 0 ? void 0 : options.hypothesis,
                    experimentType: options === null || options === void 0 ? void 0 : options.experimentType,
                    startDate: options === null || options === void 0 ? void 0 : options.startDate,
                    endDate: options === null || options === void 0 ? void 0 : options.endDate,
                    audience: options === null || options === void 0 ? void 0 : options.audience,
                    totalSampleSize: options === null || options === void 0 ? void 0 : options.totalSampleSize,
                    dateCreated: options === null || options === void 0 ? void 0 : options.dateCreated,
                    status,
                    primaryMetric: options === null || options === void 0 ? void 0 : options.primaryMetric,
                });
                const outcomeSections = yield createOutcomeCardSections(outcomeData, { includeHeader: false });
                outcomeSections.summarySection.layoutAlign = "STRETCH";
                outcomeSections.metricsTable.layoutAlign = "STRETCH";
                const summarySection = summaryHost.children[0];
                if (summarySection) {
                    summarySection.appendChild(outcomeSections.summarySection);
                }
                const metricsSection = figma.createFrame();
                metricsSection.name = "Section: Goals and Variants";
                metricsSection.layoutMode = "VERTICAL";
                metricsSection.counterAxisSizingMode = "AUTO";
                metricsSection.primaryAxisSizingMode = "AUTO";
                metricsSection.layoutAlign = "STRETCH";
                metricsSection.itemSpacing = 8;
                metricsSection.fills = [];
                const metricsLabel = figma.createText();
                metricsLabel.fontName = { family: "Figtree", style: "Bold" };
                metricsLabel.fontSize = TOKENS.fontSizeLabel;
                metricsLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
                metricsLabel.textAutoResize = "WIDTH_AND_HEIGHT";
                metricsLabel.characters = "Goals and Variants";
                metricsSection.appendChild(metricsLabel);
                metricsSection.appendChild(outcomeSections.metricsTable);
                contentStack.appendChild(metricsSection);
                // Optional variants block in single-column mode: only show when variants include descriptive context
                const variantsWithDescriptions = ((_a = options === null || options === void 0 ? void 0 : options.variants) === null || _a === void 0 ? void 0 : _a.filter(v => !!v.description && v.description.trim().length > 0)) || [];
                if (variantsWithDescriptions.length > 0) {
                    yield appendVariantsSection(contentStack, options.variants);
                }
            }
            catch (e) {
                console.error('Error creating inline outcome sections:', e);
            }
        }
        else {
            // No outcome block available: still keep key metrics central and full-width.
            // === METRICS SECTION ===
            if (metrics && metrics.length > 0) {
                try {
                    yield appendMetricsSection(contentStack, metrics);
                }
                catch (e) {
                    console.error('Error creating metrics section:', e);
                }
            }
            // === VARIANTS SECTION ===
            if ((options === null || options === void 0 ? void 0 : options.variants) && options.variants.length > 0) {
                try {
                    yield appendVariantsSection(contentStack, options.variants);
                }
                catch (e) {
                    console.error('Error creating variants section:', e);
                }
            }
        }
        // Move links section from metadata context to final supporting context.
        linksSection.layoutAlign = "STRETCH";
        contentStack.appendChild(linksSection);
        const contentTargetWidth = Math.min(CONTENT_MAX_WIDTH, Math.max(CONTENT_MIN_WIDTH, contentStack.width));
        contentStack.minWidth = contentTargetWidth;
        contentStack.maxWidth = contentTargetWidth;
        const cardContentWidth = contentTargetWidth + card.paddingLeft + card.paddingRight;
        const cardTargetWidth = Math.min(CARD_MAX_WIDTH, Math.max(card.minWidth, cardContentWidth));
        card.counterAxisSizingMode = "FIXED";
        card.minWidth = cardTargetWidth;
        card.maxWidth = cardTargetWidth;
        // Ensure card has valid dimensions
        if (card.width === 0 || card.height === 0) {
            console.warn('Card has zero dimensions, forcing layout recalculation');
            card.resize(Math.max(card.width, 792), Math.max(card.height, 612));
        }
        return card;
    });
}
/**
 * Create a two-panel canvas layout for experiment overview
 * Left panel: Info card (without resources)
 * Right panel: Resources section
 */
export function createExperimentCanvasLayout(experimentName_1) {
    return __awaiter(this, arguments, void 0, function* (experimentName, description = "", figmaLink = "", jiraLink = "", miroLink = "", notionLink = "", amplitudeLink = "", asanaLink = "", LinearLink = "", SlackLink = "", GithubLink = "", ConfluenceLink = "", TrelloLink = "", MondayLink = "", ClickupLink = "", genericLinks = [], metrics, status = 'running', options) {
        yield loadFonts();
        // Main canvas container - horizontal layout
        const canvas = figma.createFrame();
        canvas.name = `Experiment Canvas — ${experimentName}`;
        canvas.layoutMode = "HORIZONTAL";
        canvas.counterAxisSizingMode = "AUTO";
        canvas.primaryAxisSizingMode = "AUTO";
        canvas.itemSpacing = 24; // Gap between panels
        canvas.paddingLeft = canvas.paddingRight = 0;
        canvas.paddingTop = canvas.paddingBottom = 0;
        canvas.fills = [];
        canvas.strokes = [];
        canvas.effects = [];
        // Left Panel - Info Card (wider, ~60%)
        const leftPanel = figma.createFrame();
        leftPanel.name = "Overview Panel";
        leftPanel.layoutMode = "VERTICAL";
        leftPanel.counterAxisSizingMode = "FIXED";
        leftPanel.primaryAxisSizingMode = "AUTO";
        leftPanel.minWidth = 400; // Minimum width
        leftPanel.layoutGrow = 1; // Flexible to fill space
        leftPanel.paddingLeft = leftPanel.paddingRight = 0;
        leftPanel.paddingTop = leftPanel.paddingBottom = 0;
        leftPanel.itemSpacing = 0;
        leftPanel.fills = [];
        leftPanel.strokes = [];
        // Create info card without resources
        const infoCardOptions = Object.assign(Object.assign({}, options), { excludeResources: true });
        const infoCard = yield createExperimentInfoCard(experimentName, description, figmaLink, jiraLink, miroLink, notionLink, amplitudeLink, asanaLink, LinearLink, SlackLink, GithubLink, ConfluenceLink, TrelloLink, MondayLink, ClickupLink, genericLinks, metrics, status, infoCardOptions);
        leftPanel.appendChild(infoCard);
        // Right Panel - Resources (narrower, ~40%)
        const rightPanel = figma.createFrame();
        rightPanel.name = "Resources Panel";
        rightPanel.layoutMode = "VERTICAL";
        rightPanel.counterAxisSizingMode = "FIXED";
        rightPanel.primaryAxisSizingMode = "AUTO";
        rightPanel.minWidth = 350; // Minimum width (per plan spec)
        rightPanel.maxWidth = 600; // Maximum width
        rightPanel.layoutGrow = 0; // Fixed width, don't grow
        rightPanel.paddingLeft = rightPanel.paddingRight = 24;
        rightPanel.paddingTop = rightPanel.paddingBottom = 24;
        rightPanel.itemSpacing = 0;
        rightPanel.fills = [];
        rightPanel.strokes = [];
        // Create resources section
        const resourcesSection = createResourcesSection(figmaLink, jiraLink, miroLink, notionLink, amplitudeLink, asanaLink, LinearLink, SlackLink, GithubLink, ConfluenceLink, TrelloLink, MondayLink, ClickupLink, genericLinks);
        rightPanel.appendChild(resourcesSection);
        // Add panels to canvas
        canvas.appendChild(leftPanel);
        canvas.appendChild(rightPanel);
        return canvas;
    });
}
// ============================================
// RESOURCES SECTION
// ============================================
/**
 * Create resources section with all links
 * Extracted from createExperimentInfoCard for reuse in canvas layout
 */
function createResourcesSection(figmaLink = "", jiraLink = "", miroLink = "", notionLink = "", amplitudeLink = "", asanaLink = "", LinearLink = "", SlackLink = "", GithubLink = "", ConfluenceLink = "", TrelloLink = "", MondayLink = "", ClickupLink = "", genericLinks = []) {
    // Always show Resources section, even if no links (show placeholder)
    const linksSection = figma.createFrame();
    linksSection.layoutMode = "VERTICAL";
    linksSection.counterAxisSizingMode = "AUTO";
    linksSection.primaryAxisSizingMode = "AUTO";
    linksSection.primaryAxisAlignItems = "MIN";
    linksSection.counterAxisAlignItems = "MIN";
    linksSection.layoutAlign = 'STRETCH';
    linksSection.itemSpacing = 8;
    linksSection.fills = [];
    linksSection.strokes = [];
    linksSection.name = "Links Section";
    const linksLabel = figma.createText();
    linksLabel.fontName = { family: "Figtree", style: "Bold" };
    linksLabel.fontSize = TOKENS.fontSizeLabel;
    linksLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
    linksLabel.opacity = 1;
    linksLabel.textAutoResize = "WIDTH_AND_HEIGHT";
    linksLabel.characters = "Resources";
    linksSection.appendChild(linksLabel);
    // Links container - horizontal wrap for link chips
    const linksContainer = figma.createFrame();
    linksContainer.layoutMode = "HORIZONTAL";
    linksContainer.layoutWrap = "WRAP";
    linksContainer.counterAxisSizingMode = "AUTO";
    linksContainer.primaryAxisSizingMode = "AUTO";
    linksContainer.primaryAxisAlignItems = "MIN";
    linksContainer.counterAxisAlignItems = "MIN";
    linksContainer.layoutAlign = 'STRETCH';
    linksContainer.maxWidth = 282;
    linksContainer.itemSpacing = 8;
    linksContainer.counterAxisSpacing = 8;
    linksContainer.fills = [];
    linksContainer.strokes = [];
    linksContainer.name = "Links";
    // Add all links
    if (figmaLink)
        linksContainer.appendChild(createLinkChip("Figma", figmaLink));
    if (jiraLink)
        linksContainer.appendChild(createLinkChip("Jira", jiraLink));
    if (miroLink)
        linksContainer.appendChild(createLinkChip("Miro", miroLink));
    if (notionLink)
        linksContainer.appendChild(createLinkChip("Notion", notionLink));
    if (amplitudeLink)
        linksContainer.appendChild(createLinkChip("Amplitude", amplitudeLink));
    if (asanaLink)
        linksContainer.appendChild(createLinkChip("Asana", asanaLink));
    if (LinearLink)
        linksContainer.appendChild(createLinkChip("Linear", LinearLink));
    if (SlackLink)
        linksContainer.appendChild(createLinkChip("Slack", SlackLink));
    if (GithubLink)
        linksContainer.appendChild(createLinkChip("GitHub", GithubLink));
    if (ConfluenceLink)
        linksContainer.appendChild(createLinkChip("Confluence", ConfluenceLink));
    if (TrelloLink)
        linksContainer.appendChild(createLinkChip("Trello", TrelloLink));
    if (MondayLink)
        linksContainer.appendChild(createLinkChip("Monday", MondayLink));
    if (ClickupLink)
        linksContainer.appendChild(createLinkChip("Clickup", ClickupLink));
    if (genericLinks && genericLinks.length > 0) {
        genericLinks.forEach(url => {
            if (url)
                linksContainer.appendChild(createLinkChip("Link", url));
        });
    }
    // If no links, show placeholder text
    if (linksContainer.children.length === 0) {
        const placeholderText = figma.createText();
        placeholderText.fontName = { family: "Figtree", style: "Regular" };
        placeholderText.fontSize = TOKENS.fontSizeBodySm;
        placeholderText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
        placeholderText.textAutoResize = "WIDTH_AND_HEIGHT";
        placeholderText.characters = "—";
        linksContainer.appendChild(placeholderText);
    }
    linksSection.appendChild(linksContainer);
    return linksSection;
}
// ============================================
// STORY-DRIVEN LAYOUT HELPER FUNCTIONS
// ============================================
// Creates a subtle divider line between sections
function createDivider() {
    const divider = figma.createFrame();
    divider.layoutMode = "HORIZONTAL";
    divider.counterAxisSizingMode = "FIXED";
    divider.primaryAxisSizingMode = "AUTO";
    divider.layoutAlign = 'STRETCH';
    divider.resize(100, 1);
    divider.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
    divider.opacity = 0.5;
    divider.name = "Divider";
    return divider;
}
// ============================================
// TABLE-STYLE LAYOUT HELPERS (Eppo-inspired)
// ============================================
/**
 * Create Targeting section with two-column layout (Audience | Sample size)
 */
function appendTargetingSection(parent, audience, sampleSize, layout) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        // In a VERTICAL auto-layout, width is the counter-axis.
        // Set to FIXED so this section can STRETCH to the parent width.
        section.counterAxisSizingMode = "FIXED";
        section.primaryAxisSizingMode = "AUTO"; // Height hugs content
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 8;
        section.fills = [];
        section.name = "Section: Targeting";
        // Section title
        const titleLabel = figma.createText();
        titleLabel.fontName = { family: "Figtree", style: "Bold" };
        titleLabel.fontSize = TOKENS.fontSizeLabel;
        titleLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        titleLabel.opacity = 1;
        titleLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        titleLabel.characters = "Targeting";
        section.appendChild(titleLabel);
        // Details container with background
        const detailsContainer = figma.createFrame();
        detailsContainer.layoutMode = "VERTICAL";
        // In a VERTICAL auto-layout, width is the counter-axis.
        // Set counter-axis to FIXED so it can stretch to the parent width.
        detailsContainer.counterAxisSizingMode = "FIXED"; // Width can stretch to parent
        detailsContainer.primaryAxisSizingMode = "AUTO"; // Height hugs content
        detailsContainer.layoutAlign = 'STRETCH';
        detailsContainer.itemSpacing = 16;
        detailsContainer.paddingLeft = detailsContainer.paddingRight = 16;
        detailsContainer.paddingTop = detailsContainer.paddingBottom = 16;
        detailsContainer.cornerRadius = 8;
        detailsContainer.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
        detailsContainer.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
        detailsContainer.name = "Targeting Container";
        section.appendChild(detailsContainer);
        // Force a deterministic width so children (and text wrapping) don't collapse to ~100px.
        const containerWidth = (_a = layout === null || layout === void 0 ? void 0 : layout.containerWidth) !== null && _a !== void 0 ? _a : parent.width;
        if (containerWidth && containerWidth > 0) {
            detailsContainer.minWidth = containerWidth;
            detailsContainer.maxWidth = containerWidth;
        }
        // Two-column row
        const twoColumnRow = figma.createFrame();
        twoColumnRow.layoutMode = "HORIZONTAL";
        twoColumnRow.counterAxisSizingMode = "AUTO"; // Height hugs content
        // In a HORIZONTAL auto-layout, width is the primary axis.
        // Set to FIXED so it can actually fill the available width (instead of hugging its children).
        twoColumnRow.primaryAxisSizingMode = "FIXED";
        twoColumnRow.layoutAlign = 'STRETCH'; // Stretch to fill container width
        // IMPORTANT: don't set layoutGrow on a row inside a VERTICAL container,
        // or it will "Fill" height and add extra space.
        twoColumnRow.itemSpacing = 24;
        twoColumnRow.fills = [];
        twoColumnRow.name = "Two Column Row";
        detailsContainer.appendChild(twoColumnRow);
        // Compute deterministic row/column widths
        const padL = detailsContainer.paddingLeft || 0;
        const padR = detailsContainer.paddingRight || 0;
        const rowWidth = containerWidth && containerWidth > 0 ? Math.max(0, containerWidth - padL - padR) : 0;
        if (rowWidth > 0) {
            twoColumnRow.minWidth = rowWidth;
            twoColumnRow.maxWidth = rowWidth;
        }
        const gap = twoColumnRow.itemSpacing || 0;
        const colWidth = rowWidth > 0 ? Math.max(0, Math.floor((rowWidth - gap) / 2)) : 0;
        // ...other targeting fields can be added here
        parent.appendChild(section);
    });
}
/**
 * Create Metrics section with table format (Name | Goal)
 */
function appendMetricsSection(parent, metrics) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        // ...existing code for metrics table...
    });
}
/**
 * Create Variants section with table format (Name | Figma link)
 */
function appendVariantsSection(parent, variants) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 8;
        section.fills = [];
        section.visible = false;
        section.name = "OLD Section: Goals and Variants";
        // Section title
        const titleLabel = figma.createText();
        titleLabel.fontName = { family: "Figtree", style: "Bold" };
        titleLabel.fontSize = TOKENS.fontSizeLabel;
        titleLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        titleLabel.opacity = 1;
        titleLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        titleLabel.characters = "Goals and Variants";
        section.appendChild(titleLabel);
        // Table container
        const tableContainer = figma.createFrame();
        tableContainer.layoutMode = "VERTICAL";
        tableContainer.counterAxisSizingMode = "AUTO";
        tableContainer.primaryAxisSizingMode = "AUTO";
        tableContainer.layoutAlign = 'STRETCH';
        tableContainer.itemSpacing = 0;
        tableContainer.cornerRadius = 8;
        tableContainer.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
        tableContainer.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
        tableContainer.strokeWeight = 1;
        tableContainer.name = "Variants Table";
        // Table header row
        const headerRow = figma.createFrame();
        headerRow.layoutMode = "HORIZONTAL";
        headerRow.counterAxisSizingMode = "FIXED";
        headerRow.primaryAxisSizingMode = "FIXED";
        headerRow.resize(100, 32);
        headerRow.minHeight = 32;
        headerRow.layoutAlign = 'STRETCH';
        headerRow.counterAxisAlignItems = "CENTER";
        headerRow.paddingLeft = headerRow.paddingRight = 16;
        headerRow.paddingTop = headerRow.paddingBottom = 8;
        headerRow.fills = [];
        headerRow.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
        headerRow.strokeWeight = 1;
        headerRow.strokeTopWeight = 0;
        headerRow.strokeLeftWeight = 0;
        headerRow.strokeRightWeight = 0;
        headerRow.name = "Header Row";
        // Name header
        const nameHeader = figma.createText();
        nameHeader.fontName = { family: "Figtree", style: "Medium" };
        nameHeader.fontSize = TOKENS.fontSizeBodySm;
        nameHeader.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
        nameHeader.textAutoResize = "WIDTH_AND_HEIGHT";
        nameHeader.characters = "Name";
        nameHeader.layoutGrow = 1;
        headerRow.appendChild(nameHeader);
        // Figma Link header
        const linkHeader = figma.createText();
        linkHeader.fontName = { family: "Figtree", style: "Medium" };
        linkHeader.fontSize = TOKENS.fontSizeBodySm;
        linkHeader.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
        linkHeader.textAutoResize = "WIDTH_AND_HEIGHT";
        linkHeader.characters = "Figma Link";
        linkHeader.layoutGrow = 1;
        headerRow.appendChild(linkHeader);
        tableContainer.appendChild(headerRow);
        // Variant rows
        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];
            const isLast = i === variants.length - 1;
            const row = figma.createFrame();
            row.layoutMode = "HORIZONTAL";
            row.counterAxisSizingMode = "AUTO";
            row.primaryAxisSizingMode = "FIXED";
            row.resize(100, 48);
            row.minHeight = 48;
            row.layoutAlign = 'STRETCH';
            row.counterAxisAlignItems = "CENTER";
            row.paddingLeft = row.paddingRight = 16;
            row.paddingTop = row.paddingBottom = 8;
            row.fills = [];
            if (!isLast) {
                row.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
                row.strokeWeight = 1;
                row.strokeTopWeight = 0;
                row.strokeLeftWeight = 0;
                row.strokeRightWeight = 0;
            }
            row.name = `Row: ${variant.name}`;
            // Name cell with color dot
            const nameCell = figma.createFrame();
            nameCell.layoutMode = "HORIZONTAL";
            nameCell.counterAxisSizingMode = "AUTO";
            nameCell.primaryAxisSizingMode = "AUTO";
            nameCell.itemSpacing = 8;
            nameCell.counterAxisAlignItems = "CENTER";
            nameCell.layoutGrow = 1;
            nameCell.fills = [];
            // Color dot
            const colorDot = figma.createEllipse();
            colorDot.resize(8, 8);
            const variantColor = variant.color || TOKENS.royalBlue600;
            colorDot.fills = [{ type: "SOLID", color: hexToRgb(variantColor) }];
            nameCell.appendChild(colorDot);
            // Variant name
            const nameText = figma.createText();
            nameText.fontName = { family: "Figtree", style: "Regular" };
            nameText.fontSize = TOKENS.fontSizeBodySm;
            nameText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
            nameText.textAutoResize = "WIDTH_AND_HEIGHT";
            nameText.characters = variant.name || `Variant ${variant.key}`;
            nameCell.appendChild(nameText);
            if (variant.isRolledOut) {
                const rolledOutBadge = createBadge('Rolled out', 'micro', ROLLED_OUT_BADGE_BG, ROLLED_OUT_BADGE_TEXT, createRolledOutIcon());
                nameCell.appendChild(rolledOutBadge);
            }
            row.appendChild(nameCell);
            // Figma link cell
            const linkCell = figma.createFrame();
            linkCell.layoutMode = "HORIZONTAL";
            linkCell.counterAxisSizingMode = "AUTO";
            linkCell.primaryAxisSizingMode = "AUTO";
            linkCell.layoutGrow = 1;
            linkCell.fills = [];
            if (variant.figmaLink) {
                const figmaLinkText = figma.createText();
                figmaLinkText.fontName = getFontStyle("Medium");
                figmaLinkText.fontSize = TOKENS.fontSizeBodySm;
                figmaLinkText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.royalBlue600) }];
                figmaLinkText.textAutoResize = "WIDTH_AND_HEIGHT";
                figmaLinkText.characters = "Open in Figma";
                figmaLinkText.hyperlink = { type: "URL", value: variant.figmaLink.trim() };
                linkCell.appendChild(figmaLinkText);
            }
            else {
                const placeholder = figma.createText();
                placeholder.fontName = { family: "Figtree", style: "Regular" };
                placeholder.fontSize = TOKENS.fontSizeBodySm;
                placeholder.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textTertiary) }];
                placeholder.textAutoResize = "WIDTH_AND_HEIGHT";
                placeholder.characters = "—";
                linkCell.appendChild(placeholder);
            }
            row.appendChild(linkCell);
            tableContainer.appendChild(row);
        }
        section.appendChild(tableContainer);
        parent.appendChild(section);
    });
}
/**
 * Create experiment details as simple label:value pairs directly in the card
 * Uses the same styling pattern as existing working sections
 */
function appendDetailsSection(parent, title, rowsData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        // Create a simple vertical section similar to existing working sections
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "FIXED";
        section.primaryAxisSizingMode = "AUTO";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 8;
        section.fills = [];
        section.name = `Section: ${title}`;
        // Use a deterministic width so wrapped text doesn't collapse before the frame is attached.
        const sectionWidth = parent.maxWidth || parent.minWidth || parent.width;
        if (sectionWidth && sectionWidth > 0) {
            section.minWidth = sectionWidth;
            section.maxWidth = sectionWidth;
        }
        // Section title label
        const titleLabel = figma.createText();
        titleLabel.fontName = { family: "Figtree", style: "Bold" };
        titleLabel.fontSize = TOKENS.fontSizeLabel;
        titleLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        titleLabel.opacity = 1;
        titleLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        titleLabel.characters = title;
        section.appendChild(titleLabel);
        // Details container with background
        const detailsContainer = figma.createFrame();
        detailsContainer.layoutMode = "VERTICAL";
        detailsContainer.counterAxisSizingMode = "FIXED";
        detailsContainer.primaryAxisSizingMode = "AUTO";
        detailsContainer.layoutAlign = 'STRETCH';
        detailsContainer.itemSpacing = 16;
        detailsContainer.paddingLeft = detailsContainer.paddingRight = 16;
        detailsContainer.paddingTop = detailsContainer.paddingBottom = 16;
        detailsContainer.cornerRadius = 8;
        detailsContainer.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
        detailsContainer.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
        detailsContainer.opacity = 0.85;
        detailsContainer.name = "Details Container";
        section.appendChild(detailsContainer);
        if (sectionWidth && sectionWidth > 0) {
            detailsContainer.minWidth = sectionWidth;
            detailsContainer.maxWidth = sectionWidth;
        }
        const contentWidth = sectionWidth && sectionWidth > 0
            ? Math.max(0, sectionWidth - (detailsContainer.paddingLeft || 0) - (detailsContainer.paddingRight || 0))
            : 0;
        // Create each row
        for (const { label, value, valueColor, valueDot } of rowsData) {
            const row = figma.createFrame();
            row.layoutMode = "VERTICAL";
            row.counterAxisSizingMode = "FIXED";
            row.primaryAxisSizingMode = "AUTO";
            row.layoutAlign = 'STRETCH';
            row.counterAxisAlignItems = "MIN";
            row.itemSpacing = 4;
            row.fills = [];
            row.name = `Row: ${label}`;
            if (contentWidth > 0) {
                row.minWidth = contentWidth;
                row.maxWidth = contentWidth;
            }
            detailsContainer.appendChild(row);
            // Label
            const labelNode = figma.createText();
            labelNode.fontName = { family: "Figtree", style: "Regular" };
            labelNode.fontSize = TOKENS.fontSizeLabel;
            labelNode.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
            labelNode.opacity = 0.5;
            labelNode.textAutoResize = "WIDTH_AND_HEIGHT";
            labelNode.characters = label;
            row.appendChild(labelNode);
            // Value with optional dot
            if (valueDot) {
                const dot = figma.createEllipse();
                dot.resize(8, 8);
                dot.fills = [{ type: "SOLID", color: hexToRgb(valueDot) }];
                row.appendChild(dot);
            }
            const valueNode = figma.createText();
            valueNode.fontName = { family: "Figtree", style: "Medium" };
            valueNode.fontSize = TOKENS.fontSizeBodySm;
            valueNode.fills = [{ type: "SOLID", color: hexToRgb(valueColor || TOKENS.textPrimary) }];
            // Ensure long content wraps and grows in height for key detail fields
            const shouldWrapValue = label === 'Description' ||
                label === 'Hypothesis' ||
                label === 'Name' ||
                label === 'Type' ||
                label === 'Owner' ||
                label === 'Dates';
            if (shouldWrapValue) {
                valueNode.textAutoResize = "HEIGHT";
                valueNode.layoutAlign = "STRETCH";
            }
            else {
                valueNode.textAutoResize = "WIDTH_AND_HEIGHT";
            }
            valueNode.characters = value || "—";
            if (shouldWrapValue && contentWidth > 0) {
                valueNode.resize(contentWidth, valueNode.height);
            }
            row.appendChild(valueNode);
        }
        parent.appendChild(section);
    });
}
// SECTION 1: Header with date + title + description
function createStoryHeaderWithBadges(experimentName, description, _statusConfig, options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.primaryAxisAlignItems = "MIN";
        section.counterAxisAlignItems = "MIN";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 10;
        section.fills = [];
        section.strokes = [];
        section.name = "Header Section";
        // Date row
        const dateCreated = (options === null || options === void 0 ? void 0 : options.dateCreated) || new Date().toISOString().split('T')[0];
        const dateFormatted = formatDateForDisplay(dateCreated);
        const statusRow = figma.createFrame();
        statusRow.layoutMode = "HORIZONTAL";
        statusRow.counterAxisSizingMode = "AUTO";
        statusRow.primaryAxisSizingMode = "AUTO";
        statusRow.counterAxisAlignItems = "CENTER";
        statusRow.itemSpacing = 8;
        statusRow.fills = [];
        statusRow.name = "Status Row";
        const dateLabel = figma.createText();
        dateLabel.fontName = { family: "Figtree", style: "Regular" };
        dateLabel.fontSize = TOKENS.fontSizeLabel;
        dateLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary), opacity: 0.5 }];
        dateLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        dateLabel.characters = dateFormatted;
        dateLabel.name = "Date Created Label";
        statusRow.appendChild(dateLabel);
        section.appendChild(statusRow);
        // Title (Bold, 24px)
        const titleText = figma.createText();
        titleText.fontName = { family: "Figtree", style: "Bold" };
        titleText.fontSize = 24;
        titleText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        titleText.textAutoResize = "WIDTH_AND_HEIGHT";
        titleText.characters = experimentName && experimentName.length > 0 ? experimentName : 'Untitled Experiment';
        section.appendChild(titleText);
        // Description (muted)
        // if (description) {
        //   const descText = figma.createText();
        //   descText.fontName = { family: "Figtree", style: "Regular" };
        //   descText.fontSize = TOKENS.fontSizeBodyMd;
        //   descText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
        //   descText.textAutoResize = "WIDTH_AND_HEIGHT";
        //   descText.characters = description;
        //   section.appendChild(descText);
        // }
        return section;
    });
}
// CHAPTER 2: Hypothesis - the key question being tested (quoted style)
function createStoryHypothesis(hypothesis) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.primaryAxisAlignItems = "MIN";
        section.counterAxisAlignItems = "MIN";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 8;
        section.paddingTop = section.paddingBottom = 16;
        section.paddingLeft = section.paddingRight = 16;
        section.cornerRadius = 8;
        section.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.azure50) }];
        section.strokes = [];
        section.name = "Hypothesis Section";
        // Label with question framing
        const labelText = figma.createText();
        labelText.fontName = { family: "Figtree", style: "Medium" };
        labelText.fontSize = TOKENS.fontSizeLabel;
        labelText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        labelText.opacity = 0.5;
        labelText.textAutoResize = "WIDTH_AND_HEIGHT";
        labelText.characters = "Hypothesis";
        section.appendChild(labelText);
        // Hypothesis text with quote styling
        const hypothesisText = figma.createText();
        hypothesisText.fontName = { family: "Figtree", style: "Regular" };
        hypothesisText.fontSize = TOKENS.fontSizeBodyMd;
        hypothesisText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        hypothesisText.textAutoResize = "WIDTH_AND_HEIGHT";
        hypothesisText.characters = `"${hypothesis}"`;
        section.appendChild(hypothesisText);
        return section;
    });
}
// ============================================
// LEGACY FUNCTIONS (keeping for compatibility)
// ============================================
// Card header with date, title, and description
function createCardHeader(experimentName, description, _statusConfig, options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.primaryAxisAlignItems = "MIN";
        section.counterAxisAlignItems = "MIN";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 12;
        section.fills = [];
        section.strokes = [];
        section.name = "Header Section";
        // Date created label - auto-populated (above badge row)
        const dateCreatedCompact = (options === null || options === void 0 ? void 0 : options.dateCreated) || new Date().toISOString().split('T')[0];
        const dateFormattedCompact = formatDateForDisplay(dateCreatedCompact);
        const dateLabelCompact = figma.createText();
        dateLabelCompact.fontName = { family: "Figtree", style: "Regular" };
        dateLabelCompact.fontSize = TOKENS.fontSizeLabel;
        dateLabelCompact.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary), opacity: 0.5 }];
        dateLabelCompact.textAutoResize = "WIDTH_AND_HEIGHT";
        dateLabelCompact.characters = dateFormattedCompact;
        dateLabelCompact.name = "Date Created Label";
        section.appendChild(dateLabelCompact);
        // Title (Bold, 24px)
        const titleText = figma.createText();
        titleText.fontName = { family: "Figtree", style: "Bold" };
        titleText.fontSize = 24;
        titleText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        titleText.textAutoResize = "WIDTH_AND_HEIGHT";
        titleText.characters = experimentName && experimentName.length > 0 ? experimentName : 'Untitled Experiment';
        section.appendChild(titleText);
        // Description (muted)
        if (description) {
            const descText = figma.createText();
            descText.fontName = { family: "Figtree", style: "Regular" };
            descText.fontSize = TOKENS.fontSizeBodyMd;
            descText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
            descText.textAutoResize = "WIDTH_AND_HEIGHT";
            descText.characters = description;
            section.appendChild(descText);
        }
        return section;
    });
}
// Details row: Type + Owner + Dates
function createDetailsRow(experimentType, owner, startDate, endDate) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const row = figma.createFrame();
        row.layoutMode = "HORIZONTAL";
        row.counterAxisSizingMode = "AUTO";
        row.primaryAxisSizingMode = "AUTO";
        row.primaryAxisAlignItems = "MIN";
        row.counterAxisAlignItems = "MIN";
        row.layoutAlign = 'STRETCH';
        row.itemSpacing = 32;
        row.fills = [];
        row.strokes = [];
        row.name = "Details Row";
        // Helper to create a column
        const createColumn = (label, value) => {
            const col = figma.createFrame();
            col.layoutMode = "VERTICAL";
            col.counterAxisSizingMode = "AUTO";
            col.primaryAxisSizingMode = "AUTO";
            col.itemSpacing = 4;
            col.fills = [];
            col.strokes = [];
            col.name = `${label} Column`;
            const labelText = figma.createText();
            labelText.fontName = { family: "Figtree", style: "Medium" };
            labelText.fontSize = TOKENS.fontSizeLabel;
            labelText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
            labelText.opacity = 0.5;
            labelText.textAutoResize = "WIDTH_AND_HEIGHT";
            labelText.characters = label;
            col.appendChild(labelText);
            const valueText = figma.createText();
            valueText.fontName = { family: "Figtree", style: "Regular" };
            valueText.fontSize = TOKENS.fontSizeBodyMd;
            valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
            valueText.textAutoResize = "WIDTH_AND_HEIGHT";
            valueText.characters = value;
            col.appendChild(valueText);
            return col;
        };
        // Type column
        if (experimentType) {
            row.appendChild(createColumn("Type", getExperimentTypeLabel(experimentType)));
        }
        // Owner column
        if (owner) {
            row.appendChild(createColumn("Owner", owner));
        }
        // Dates column
        if (startDate || endDate) {
            const formatDate = (dateStr) => {
                const date = new Date(dateStr);
                if (isNaN(date.getTime()))
                    return dateStr;
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            };
            let timelineStr = '';
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                const diffMs = end.getTime() - start.getTime();
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const weeks = Math.floor(diffDays / 7);
                const days = diffDays % 7;
                const durationStr = weeks > 0 ? (days > 0 ? `${weeks}w ${days}d` : `${weeks}w`) : `${days}d`;
                timelineStr = `${formatDate(startDate)} → ${formatDate(endDate)} (${durationStr})`;
            }
            else if (startDate) {
                timelineStr = `Started ${formatDate(startDate)}`;
            }
            else if (endDate) {
                timelineStr = `Ends ${formatDate(endDate)}`;
            }
            row.appendChild(createColumn("Dates", timelineStr));
        }
        return row;
    });
}
// Target row: Audience + Sample Size
function createTargetRow(audience, sampleSize) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const row = figma.createFrame();
        row.layoutMode = "HORIZONTAL";
        row.counterAxisSizingMode = "AUTO";
        row.primaryAxisSizingMode = "AUTO";
        row.primaryAxisAlignItems = "MIN";
        row.counterAxisAlignItems = "MIN";
        row.layoutAlign = 'STRETCH';
        row.itemSpacing = 32;
        row.fills = [];
        row.strokes = [];
        row.name = "Target Row";
        // Helper to create a column
        const createColumn = (label, value) => {
            const col = figma.createFrame();
            col.layoutMode = "VERTICAL";
            col.counterAxisSizingMode = "AUTO";
            col.primaryAxisSizingMode = "AUTO";
            col.itemSpacing = 4;
            col.fills = [];
            col.strokes = [];
            col.name = `${label} Column`;
            const labelText = figma.createText();
            labelText.fontName = { family: "Figtree", style: "Medium" };
            labelText.fontSize = TOKENS.fontSizeLabel;
            labelText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
            labelText.opacity = 0.5;
            labelText.textAutoResize = "WIDTH_AND_HEIGHT";
            labelText.characters = label;
            col.appendChild(labelText);
            const valueText = figma.createText();
            valueText.fontName = { family: "Figtree", style: "Regular" };
            valueText.fontSize = TOKENS.fontSizeBodyMd;
            valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
            valueText.textAutoResize = "WIDTH_AND_HEIGHT";
            valueText.characters = value;
            col.appendChild(valueText);
            return col;
        };
        // Audience column
        if (audience) {
            row.appendChild(createColumn("Audience", audience));
        }
        // Sample Size column
        if (sampleSize !== undefined && sampleSize > 0) {
            row.appendChild(createColumn("Sample size", sampleSize.toLocaleString()));
        }
        return row;
    });
}
// Outcome row: Status + Rolled out variant (only shown when rolled out)
function createOutcomeRow(statusConfig, variantName, variantColor) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const row = figma.createFrame();
        row.layoutMode = "HORIZONTAL";
        row.counterAxisSizingMode = "AUTO";
        row.primaryAxisSizingMode = "AUTO";
        row.primaryAxisAlignItems = "MIN";
        row.counterAxisAlignItems = "MIN";
        row.layoutAlign = 'STRETCH';
        row.itemSpacing = 32;
        row.fills = [];
        row.strokes = [];
        row.name = "Outcome Row";
        // Status column (left)
        const statusCol = figma.createFrame();
        statusCol.layoutMode = "VERTICAL";
        statusCol.counterAxisSizingMode = "AUTO";
        statusCol.primaryAxisSizingMode = "AUTO";
        statusCol.itemSpacing = 4;
        statusCol.fills = [];
        statusCol.strokes = [];
        statusCol.name = "Status Column";
        const statusLabel = figma.createText();
        statusLabel.fontName = { family: "Figtree", style: "Medium" };
        statusLabel.fontSize = TOKENS.fontSizeLabel;
        statusLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        statusLabel.opacity = 0.5;
        statusLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        statusLabel.characters = "Status";
        statusCol.appendChild(statusLabel);
        const statusValue = figma.createText();
        statusValue.fontName = { family: "Figtree", style: "Regular" };
        statusValue.fontSize = TOKENS.fontSizeBodyMd;
        statusValue.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        statusValue.textAutoResize = "WIDTH_AND_HEIGHT";
        statusValue.characters = statusConfig.label;
        statusCol.appendChild(statusValue);
        row.appendChild(statusCol);
        // Rolled out column (right)
        const rolledOutCol = figma.createFrame();
        rolledOutCol.layoutMode = "VERTICAL";
        rolledOutCol.counterAxisSizingMode = "AUTO";
        rolledOutCol.primaryAxisSizingMode = "AUTO";
        rolledOutCol.itemSpacing = 4;
        rolledOutCol.fills = [];
        rolledOutCol.strokes = [];
        rolledOutCol.name = "Rolled Out Column";
        const rolledOutLabel = figma.createText();
        rolledOutLabel.fontName = { family: "Figtree", style: "Medium" };
        rolledOutLabel.fontSize = TOKENS.fontSizeLabel;
        rolledOutLabel.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        rolledOutLabel.opacity = 0.5;
        rolledOutLabel.textAutoResize = "WIDTH_AND_HEIGHT";
        rolledOutLabel.characters = "Variant rolled out";
        rolledOutCol.appendChild(rolledOutLabel);
        // Value row with radio button and variant name
        const valueRow = figma.createFrame();
        valueRow.layoutMode = "HORIZONTAL";
        valueRow.counterAxisSizingMode = "AUTO";
        valueRow.primaryAxisSizingMode = "AUTO";
        valueRow.itemSpacing = 6;
        valueRow.primaryAxisAlignItems = "MIN";
        valueRow.counterAxisAlignItems = "CENTER";
        valueRow.fills = [];
        valueRow.strokes = [];
        valueRow.name = "Value Row";
        // Radio button indicator (uses variant color or default purple)
        const radioButton = figma.createEllipse();
        radioButton.resize(10, 10);
        const color = variantColor || TOKENS.electricViolet600;
        radioButton.fills = [{ type: "SOLID", color: hexToRgb(color) }];
        radioButton.strokes = [];
        radioButton.name = "Radio Button";
        valueRow.appendChild(radioButton);
        // Variant name
        const valueText = figma.createText();
        valueText.fontName = { family: "Figtree", style: "Medium" };
        valueText.fontSize = TOKENS.fontSizeBodyMd;
        valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        valueText.textAutoResize = "WIDTH_AND_HEIGHT";
        valueText.characters = variantName;
        valueRow.appendChild(valueText);
        rolledOutCol.appendChild(valueRow);
        row.appendChild(rolledOutCol);
        return row;
    });
}
function createHypothesisSection(hypothesis) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.primaryAxisAlignItems = "MIN";
        section.counterAxisAlignItems = "MIN";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 8;
        section.paddingTop = section.paddingBottom = 12;
        section.paddingLeft = section.paddingRight = 12;
        section.cornerRadius = 8;
        section.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsBackground) }];
        section.strokes = [];
        section.name = "Hypothesis Section";
        // Label (styled same as Resources)
        const labelText = figma.createText();
        labelText.fontName = { family: "Figtree", style: "Medium" };
        labelText.fontSize = TOKENS.fontSizeLabel;
        labelText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        labelText.opacity = 0.5;
        labelText.textAutoResize = "WIDTH_AND_HEIGHT";
        labelText.characters = "Hypothesis";
        section.appendChild(labelText);
        // Hypothesis text
        const hypothesisText = figma.createText();
        hypothesisText.fontName = { family: "Figtree", style: "Regular" };
        hypothesisText.fontSize = TOKENS.fontSizeBodyMd;
        hypothesisText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        hypothesisText.textAutoResize = "WIDTH_AND_HEIGHT";
        hypothesisText.characters = hypothesis;
        section.appendChild(hypothesisText);
        return section;
    });
}
function createTimelineSection(startDateStr, endDateStr) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.primaryAxisAlignItems = "MIN";
        section.counterAxisAlignItems = "MIN";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 4;
        section.fills = [];
        section.strokes = [];
        section.name = "Dates Section";
        // Helper to format date - handles YYYY-MM-DD format from date picker
        const formatDate = (dateStr) => {
            if (!dateStr)
                return "";
            const parts = dateStr.split('-');
            if (parts.length !== 3)
                return dateStr;
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        };
        // Calculate duration in days
        const calculateDuration = (start, end) => {
            if (!start || !end)
                return "";
            const startParts = start.split('-');
            const endParts = end.split('-');
            const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
            const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0)
                return "Same day";
            if (diffDays === 1)
                return "1 day";
            if (diffDays < 7)
                return `${diffDays} days`;
            const weeks = Math.floor(diffDays / 7);
            const remainingDays = diffDays % 7;
            if (remainingDays === 0)
                return weeks === 1 ? "1 week" : `${weeks} weeks`;
            return `${weeks}w ${remainingDays}d`;
        };
        // Label (styled same as Resources)
        const labelText = figma.createText();
        labelText.fontName = { family: "Figtree", style: "Medium" };
        labelText.fontSize = TOKENS.fontSizeLabel;
        labelText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        labelText.opacity = 0.5;
        labelText.textAutoResize = "WIDTH_AND_HEIGHT";
        labelText.characters = "Dates";
        section.appendChild(labelText);
        // Build dates text: "Jan 23, 2026 → Jan 31, 2026 (8 days)"
        let timelineStr = "";
        if (startDateStr) {
            timelineStr += formatDate(startDateStr);
        }
        if (startDateStr && endDateStr) {
            timelineStr += " → ";
        }
        if (endDateStr) {
            timelineStr += formatDate(endDateStr);
        }
        if (startDateStr && endDateStr) {
            const duration = calculateDuration(startDateStr, endDateStr);
            if (duration) {
                timelineStr += ` (${duration})`;
            }
        }
        const valueText = figma.createText();
        valueText.fontName = { family: "Figtree", style: "Regular" };
        valueText.fontSize = TOKENS.fontSizeBodyMd;
        valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        valueText.textAutoResize = "WIDTH_AND_HEIGHT";
        valueText.characters = timelineStr;
        section.appendChild(valueText);
        return section;
    });
}
// Sample Size section removed - now shown in Outcome Card header
function createSection(label_1, value_1) {
    return __awaiter(this, arguments, void 0, function* (label, value, _muted = false) {
        yield loadFonts();
        const section = figma.createFrame();
        section.layoutMode = "VERTICAL";
        section.counterAxisSizingMode = "AUTO";
        section.primaryAxisSizingMode = "AUTO";
        section.primaryAxisAlignItems = "MIN";
        section.counterAxisAlignItems = "MIN";
        section.layoutAlign = 'STRETCH';
        section.itemSpacing = 8;
        section.fills = [];
        section.strokes = [];
        section.name = `${label} Section`;
        // Skip label text for Description section
        if (label !== "Description") {
            const labelText = figma.createText();
            labelText.fontName = { family: "Figtree", style: getLoadedFigtreeSemibold() };
            labelText.fontSize = 14;
            labelText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textSecondary) }];
            labelText.textAutoResize = "WIDTH_AND_HEIGHT";
            labelText.characters = label;
            section.appendChild(labelText);
        }
        const valueText = figma.createText();
        valueText.fontName = { family: "Figtree", style: "Regular" };
        valueText.fontSize = 14;
        valueText.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
        valueText.textAutoResize = label === "Description" ? "HEIGHT" : "WIDTH_AND_HEIGHT";
        valueText.characters = value;
        section.appendChild(valueText);
        // If Description, make valueText fill section width
        if (label === "Description") {
            valueText.layoutAlign = "STRETCH";
            // Optionally, still ensure width matches section
            valueText.resizeWithoutConstraints(section.width, valueText.height);
        }
        return section;
    });
}
function createLinkChip(label, url) {
    const chip = figma.createFrame();
    chip.layoutMode = "HORIZONTAL";
    chip.counterAxisSizingMode = "AUTO";
    chip.primaryAxisSizingMode = "AUTO";
    chip.primaryAxisAlignItems = "MIN";
    chip.counterAxisAlignItems = "CENTER";
    chip.layoutAlign = 'STRETCH';
    chip.minWidth = 137; // 21rem
    chip.maxWidth = 137; // 21rem
    chip.itemSpacing = 8;
    chip.paddingLeft = chip.paddingRight = 8;
    chip.paddingTop = chip.paddingBottom = 8;
    chip.cornerRadius = 4;
    chip.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.fillsSurface) }];
    chip.strokes = [{ type: "SOLID", color: hexToRgb(TOKENS.border) }];
    chip.strokeWeight = 1;
    chip.name = "Link Chip";
    // Brand icon (vector) - larger size for this layout
    const icon = createBrandIconVector(label, 16);
    chip.appendChild(icon);
    // Text container (vertical stack for title + URL)
    const textContainer = figma.createFrame();
    textContainer.layoutMode = "VERTICAL";
    textContainer.counterAxisSizingMode = "AUTO";
    textContainer.primaryAxisSizingMode = "AUTO";
    textContainer.itemSpacing = 0;
    textContainer.fills = [];
    textContainer.name = "Link Text";
    textContainer.layoutAlign = "STRETCH";
    // Title - descriptive link label
    const linkLabels = {
        'Figma': 'Figma link',
        'Miro': 'Miro board',
        'Jira': 'Jira ticket',
        'Notion': 'Notion page',
        'Amplitude': 'Amplitude dashboard',
        'Generic': 'Link to website',
        'Asana': 'Asana task',
        'Linear': 'Linear ticket',
        'Slack': 'Slack channel',
        'GitHub': 'GitHub repository',
        'Confluence': 'Confluence page',
        'Trello': 'Trello board',
        'Monday': 'Monday task',
        'ClickUp': 'ClickUp task',
    };
    const title = figma.createText();
    title.fontName = { family: "Figtree", style: "Regular" };
    title.fontSize = TOKENS.fontSizeBodySm;
    title.lineHeight = { unit: "PIXELS", value: 12 };
    title.fills = [{ type: "SOLID", color: hexToRgb(TOKENS.textPrimary) }];
    title.textAutoResize = "WIDTH_AND_HEIGHT";
    title.name = "Link Title";
    const titleText = linkLabels[label] || `${label} link`;
    title.characters = titleText;
    // Add hyperlink to the title text
    if (url) {
        title.setRangeHyperlink(0, titleText.length, { type: 'URL', value: url });
    }
    textContainer.appendChild(title);
    chip.appendChild(textContainer);
    return chip;
}
