import type { ImgHTMLAttributes } from 'react';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

export const BrandingLogoIcon = ({ ...props }: LogoProps) => {
  return (
    <img
      src="/static/mj.jpg"
      alt="MJ Limousine"
      className="rounded-full object-cover"
      {...props}
    />
  );
};
