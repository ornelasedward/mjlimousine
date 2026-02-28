import type { ImgHTMLAttributes } from 'react';

export type LogoProps = ImgHTMLAttributes<HTMLImageElement>;

export const BrandingLogo = ({ ...props }: LogoProps) => {
  return (
    <img
      src="/static/mj.jpg"
      alt="MJ Limousine"
      className="rounded-full object-cover"
      {...props}
    />
  );
};
