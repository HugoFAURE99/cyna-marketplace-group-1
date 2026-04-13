import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1 className="text-4xl font-bold">Bienvenue sur le site de Cyna</h1>
      <a href="/admin">page admin</a>
    </div>
  );
}
