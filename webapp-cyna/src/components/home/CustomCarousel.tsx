import * as React from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const carouselCardsData = [
  {
    img: "/images/card1.jpg",
    type: "ENTERPRISE GRADE",
    title: "Titre de la carte 1",
    description: "Description de la carte 1. Lorem ipsum dolor sit amet.",
    link: "/",
  },
  {
    img: "/images/card2.jpg",
    alt_img: "Image de la carte 2",
    type: "ENTERPRISE GRADE",
    title: "Titre de la carte 2",
    description: "Description de la carte 2. Consectetur adipiscing elit.",
    link: "/",
  },
  {
    img: "/images/card3.jpg",
    type: "ENTERPRISE GRADE",
    title: "Titre de la carte 3",
    description: "Description de la carte 3. Sed do eiusmod tempor incididunt.",
    link: "/",
  },
  // Ajoutez d'autres cartes ici si nécessaire
];

export default function CustomCarousel() {
  return (
    <Carousel className="w-full relative">
      {" "}
      {/* Suppression de flex-col */}
      <div className="absolute top-50 left-0 right-0 flex justify-center items-center z-10 space-x-4 py-5 gap-400">
        <CarouselPrevious className="!static !translate-y-0 bg-white/80" />
        <CarouselNext className="!static !translate-y-0" />
      </div>
      <CarouselContent className="-ml-1">
        {carouselCardsData.map((card, index) => (
          <CarouselItem key={index} className="basis-full">
            <div>
              <Card className="p-30 pl-60">
                <div>
                  <CardContent className="flex flex-col h-full">
                    <p className="bg-purple-900/75 text-white p-2 w-40 mb-4 text-center rounded-2xl">
                      {card.type}
                    </p>
                    <CardTitle className="text-6xl font-bold w-80">
                      {card.title}
                    </CardTitle>
                    <CardDescription className="my-6 w-90 text-xl">
                      {card.description}
                    </CardDescription>
                    <div className="mt-2">
                      <a
                        href={card.link}
                        className="bg-purple-500 shadow-lg shadow-blue-300 p-3 w-40 text-center rounded-md text-white hover:bg-purple-400 transition-colors duration-300"
                      >
                        Explore Services →
                      </a>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
