import Image from "next/image";

interface LoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ message = "Cargando...", size = "md" }: LoadingProps) {
  const sizes = {
    sm: 80,
    md: 120,
    lg: 180,
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <Image
        src="/poker-card-tiny.gif"
        alt="Loading"
        width={sizes[size]}
        height={sizes[size]}
        unoptimized
        priority
      />
      {message && (
        <p className="text-slate-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
