interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="hidden lg:block border-b border-border bg-card">
      <div className="px-8 py-4">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
    </header>
  );
}
