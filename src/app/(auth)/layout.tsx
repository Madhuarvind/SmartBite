import { ForkAndLeaf } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 flex items-center gap-2">
         <ForkAndLeaf className="w-10 h-10 text-primary" />
         <h1 className="text-3xl font-bold text-primary">SmartBite</h1>
      </div>
      {children}
    </div>
  );
}
