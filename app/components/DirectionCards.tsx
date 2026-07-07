import Link from "next/link"
import DirectionCard from "./DirectionCard.tsx"

export default function DirectionCards() {
  return (
    <div className="grid grid-cols-3 w-fit mx-auto gap-6 justify-center">
      <DirectionCard title="Вы HR?" description="Ознакомьтесь с моим резюме" />
      <DirectionCard title="Вам интересна моя жизнь?" description="Почитайте мой блог" />
      <DirectionCard title="Вы не знаете кто я такой?" description="Давайте я расскажу о себе и мы это исправим!" />
    </div>
  );
}
