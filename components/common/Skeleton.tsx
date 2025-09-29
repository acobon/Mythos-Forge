import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, width, height }) => {
  const style = {
    width: width,
    height: height,
  };
  return (
    <div
      className={`bg-border-color/50 animate-pulse rounded-md ${className || ''}`}
      style={style}
    />
  );
};

export default Skeleton;
