import React from "react";
import Image from "next/image";
interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export const NexgeglLogo: React.FC<LogoProps> = ({
  className = "h-8",
  iconOnly = false,
}) => {
  // const fullLogoSrc = "../../../public/NEXGEGL-White-Logo.png";
  // const iconSrc = "../../../public/NEXGEGL-White-Logo.png";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {iconOnly ? (
        // Display icon only
        <Image
          src="/images/NEXGEGL-White-Logo.png"
          alt="NEXGEGL Icon"
          className="h-full w-auto object-contain"
          width={100}
          height={100}
          priority
        />
      ) : (
        // Display full logo (default)
        <Image
          src="/images/NEXGEGL-White-Logo.png"
          alt="NEXGEGL Logo"
          // className="h-full w-auto object-contain"
          width={200}
          height={200}
          priority
        />
      )}
    </div>
  );
};
