import Link from "next/link"

export default function Nav() {
  return (
    <div className="border border-black w-fit mx-auto rounded-2xl">
    <nav className="flex gap-6 px-8 py-4 justify-center">
      <Link href="/" className="text-base hover:underline">
        Главная
      </Link>
      <Link href="/about" className="text-base hover:underline">
        Обо мне
      </Link>
      <Link href="/now" className="text-base hover:underline">
        Сейчас
      </Link>
      <Link href="/contacts" className="text-base hover:underline">
        Контакты
      </Link>
    </nav>
    </div>
  );
}
