interface Props {
  label?: string;
}

export function LoadingScreen({ label }: Props) {
  return (
    <div className="loading-shell-bg grid min-h-[100dvh] w-full place-items-center">
      <h1 className="relative z-10 font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
        {label ?? "Carregando"}
      </h1>
    </div>
  );
}

export default LoadingScreen;
