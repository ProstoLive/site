export default function DirectionCard({ title, description }) {
  return (
    <div className="border border-black px-4 py-6 rounded-xl">
      <h2>{title}</h2>
      <h4>{description}</h4>
    </div>
  );
}
