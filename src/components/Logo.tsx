interface LogoProps {
  className?: string;
}

const Logo = ({ className = "w-24 h-auto" }: LogoProps) => {
  return (
    <svg 
      viewBox="0 0 1071 545" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path 
        d="M117 483L178.5 316.5M178.5 316.5L245 137L283.5 251.5M178.5 316.5L108 307.5M245 137L214.5 54.5M245 137L327.5 130.5M447.5 221.5L418 316.5M418 316.5L383 440.5M418 316.5L343.5 307.5M418 316.5L497 325M517 215.5L482.5 316.5M482.5 316.5L438 440.5M482.5 316.5L563.5 330.5M685 221.5L655.5 316.5M655.5 316.5L620.5 440.5M655.5 316.5L581 307.5M655.5 316.5L734.5 325M754.5 215.5L720 316.5M720 316.5L675.5 440.5M720 316.5L801 330.5M811.5 470L873 303.5M873 303.5L939.5 124L978 238.5M873 303.5L802.5 294.5M939.5 124L909 41.5M939.5 124L1022 117.5" 
        stroke="currentColor" 
        strokeWidth="15" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
