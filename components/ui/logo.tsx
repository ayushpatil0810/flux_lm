import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";
import fluxIcon from "@/app/icon.png";

export type FluxLogoProps = Partial<ImageProps>;

export function FluxLogo({
  className,
  alt = "Flux",
  priority = true,
  ...props
}: FluxLogoProps) {
  return (
    <Image
      src={fluxIcon}
      alt={alt}
      priority={priority}
      className={cn("size-8 object-contain", className)}
      {...props}
    />
  );
}

export const TallieLogo = FluxLogo;

