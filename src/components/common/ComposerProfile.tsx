import React from "react";

interface ComposerProfileProps {
  name: string;
  profileImage?: string | null;
  size?: "sm" | "md" | "lg";
  showImage?: boolean;
  className?: string;
}

export default function ComposerProfile({
  name,
  profileImage,
  size = "md",
  showImage = true,
  className = "",
}: ComposerProfileProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const initialsTextSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Get initials from name (first letter of first and last name)
  const getInitials = (name: string): string => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showImage && (
        <div
          className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center flex-shrink-0`}
        >
          {profileImage ? (
            <img
              src={profileImage}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span
              className={`font-semibold text-white ${initialsTextSize[size]}`}
            >
              {getInitials(name)}
            </span>
          )}
        </div>
      )}
      <span
        className={`text-gray-800 dark:text-white/90 ${textSizeClasses[size]}`}
      >
        {name}
      </span>
    </div>
  );
}
