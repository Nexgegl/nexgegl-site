export type Dictionary = {
  Landing: {
    nav: {
      [key: string]: string;
    };

    common: {
      switchTo: string;
      login: string;
    };

    hero: HeroDictionary;
    about: {
      label: string;
      title: string;
      subtitle: string;
      imageAlt: string;
      description: string;
      overlay: {
        text: string;
        stat: string;
        statLabel: string;
      };

      integrations: Record<string, string>;
    };
    decisionContract: DecisionContractDictionary;

    visionMission: VisionMissionDictionary;

    problems: ProblemsDictionary;

    solutions: SolutionsDictionary;

    values: {
      header: {
        label: string;
        title: string;
        subtitle: string;
      };

      items: Record<
        string,
        {
          title: string;
          description: string;
        }
      >;
    };

    governance: {
      label: string;
      title: string;
      description: string;

      features: {
        [key: string]: {
          title: string;
          description: string;
        };
      };

      overlay: string;
      stat: string;
      statLabel: string;

      badge: {
        title: string;
        subtitle: string;
      };
    };

    experience: {
      label: string;
      title: string;
      desc: string;
      years: string;
      yearsLabel: string;
      items: Record<
        string,
        {
          title: string;
          desc: string;
          image: string;
        }
      >;
    };

 footer: {
  brandDescription: string;

  mediaLicense?: string;

  contact?: {
    title: string;
    email: string;
    website: string;
    websiteLabel: string;
    phone: string;
  };

  platform?: {
    title: string;
    links: {
      label: string;
      href: string;
    }[];
  };

  client?: {
    title: string;
    description: string;
    button: string;
  };

  bottom: {
    rights: string;
    privacy: string;
    terms?: string;
  };
};

  };
  SME: SMEDictionary;
   privacyPolicy: {
    title: string;
    version: string;
    canonicalNote: string;
    content: string;
  };
};

export type DecisionContractDictionary = {
  label: string;
  title: string;
  description: string;
};

export type SMEDictionary = {
  title: string;
  description: string;
  cta: string;
  consent: string;
};



export type ProblemsHeader = {
  label: string;
  title: string;
  subtitle: string;
};

export type ProblemItem = {
  title: string;
  subtitle: string;
  description: string;
  statLabel: string;
};

export type ProblemsDictionary = {
  header: ProblemsHeader;
  painPoint: string;
  overlay: string;
  items: {
    [key: string]: ProblemItem;
  };
};

export type SolutionsHeader = {
  label: string;
  title: string;
  subtitle: string;
};

export type SolutionItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
};

export type SolutionsDictionary = {
  header: SolutionsHeader;
  items: {
    [key: string]: SolutionItem;
  };
};
export type VisionMissionBlock = {
  title: string;
  text: string;
  imageAlt: string;
};

export type VisionMissionDictionary = {
  vision: VisionMissionBlock;
  mission: VisionMissionBlock;
};

// export type Lang = "en" | "ar";

/* ================= HERO ================= */

export interface HeroTitle {
  line1: string;
  highlight: string;
  line2: string;
}

export interface HeroDescription {
  main: string;
  sub: string;
}

export interface HeroProtocols {
  kill: string;
  fix: string;
  scale: string;
}

export interface HeroButtons {
  enter: string;
  privacy: string;
}

export type HeroTags = Record<string, string>;

export interface HeroDictionary {
  branding: string;
  title: HeroTitle;
  description: HeroDescription;
  protocols: HeroProtocols;
  buttons: HeroButtons;
  tags: HeroTags;
  scroll: string;
}
import type { ComponentType } from "react";

export type IconType = ComponentType<{
  size?: number;
  className?: string;
}>;
