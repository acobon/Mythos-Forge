import React from 'react';
import Skeleton from '../common/Skeleton';

const EntityDetailSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <header className="flex items-start space-x-4">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="flex-grow pt-2">
        <Skeleton height="36px" width="60%" />
        <Skeleton height="20px" width="30%" className="mt-2" />
      </div>
    </header>
    {/* Tags */}
    <div className="space-y-2">
      <Skeleton height="24px" width="15%" />
      <Skeleton height="44px" />
    </div>
    {/* Summary */}
    <div className="space-y-2">
      <Skeleton height="24px" width="30%" />
      <Skeleton height="88px" />
    </div>
    {/* Vitals/Attributes */}
    <div className="space-y-2">
      <Skeleton height="24px" width="20%" />
      <Skeleton height="80px" />
    </div>
    {/* Events Header */}
    <div className="flex justify-between items-center">
      <Skeleton height="24px" width="25%" />
      <Skeleton height="32px" width="100px" />
    </div>
    {/* Event Cards */}
    <div className="space-y-4">
      <Skeleton height="120px" />
      <Skeleton height="120px" />
    </div>
  </div>
);


const EntityViewSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row h-full">
      <div className="w-full md:w-1/3 border-r-0 md:border-r border-border-color p-4">
        {/* Search Bar */}
        <Skeleton height="44px" className="mb-4" />
        {/* List Items */}
        <div className="space-y-2">
            <Skeleton height="28px" width="40%" className="mb-2" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="28px" width="40%" className="mt-4 mb-2" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
        </div>
      </div>
      <div className="w-full md:w-2/3 p-4 md:p-8 overflow-y-auto">
        <EntityDetailSkeleton />
      </div>
    </div>
  );
};

export default EntityViewSkeleton;