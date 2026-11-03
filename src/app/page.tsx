import { contractPreview, logos } from "@/lib/content";
import Experience from "@/components/Experience";
export default async function Home() {
  return (
    <Experience contract={await contractPreview()} logos={await logos()} />
  );
}
