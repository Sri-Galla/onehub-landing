import { Hero } from '@/components/Hero'
import { ThemeVariables } from '@/components/ThemeVariables'

export default function Home() {
  return (
    <main className="font-sans">
      <ThemeVariables />
      <Hero />    
    </main>
  );
}
