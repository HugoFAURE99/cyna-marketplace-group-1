import NavBar from "@/components/navbar/NavBar"
import CustomCarousel from "@/components/home/CustomCarousel"
import Image from "next/image"
import GridItems from "@/components/home/GridItems";

export default function Home() {
  return (
    <>
      <NavBar />
      <CustomCarousel />
      <div className="my-10 mb-40 mx-50">
        <h1 className="text-purple-800">WHY CYNA</h1>
        <h2 className="w-100 font-bold text-3xl my-4">Enterprise cybersecurity, built for scale.</h2>
        <p className="text-gray-400 my-4 mb-15">SOC, EDR & XDR services with 24/7 monitoring, one subscription, instant deployment.</p>
        <a href="/" className="text-purple-500 font-bold">Browse all services →</a>
      </div>
      <GridItems
        headerText="CATEGORIES"
        titleText="Browse by Solutions"
        viewAllLink="/solutions"
      />
    </>
  );
}
