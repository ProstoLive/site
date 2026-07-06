import Link from "next/link"

export default function Nav() {
  return (
    <nav className="flex gap-6 px-8 py-4">
      <Link href="/" className="text-sm hover:underline">
        Главная
      </Link>
      <Link href="/about" className="text-sm hover:underline">
        Обо мне
      </Link>
      <Link href="/now" className="text-sm hover:underline">
        Сейчас
      </Link>
      <Link href="/contacts" className="text-sm hover:underline">
        Контакты
      </Link>
    </nav>
  );
}
