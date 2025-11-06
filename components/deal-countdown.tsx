"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";
import promo from "@/public/images/promo.jpg";
import { useEffect, useState } from "react";

// Set Target date:
const TARGET_DATE = new Date().getTime() + 3 * 24 * 60 * 60 * 1000; // 3 days from now

// Calculate the remaining time
const calculateTimeLeft = (targetDate: number) => {
  const now = new Date().getTime();
  const difference = new Date(targetDate).getTime() - now;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const DealCountdown = () => {
  const [time, setTime] = useState<ReturnType<typeof calculateTimeLeft>>();

  useEffect(() => {
    // Calculate initial time:
    setTime(calculateTimeLeft(TARGET_DATE));

    const timeInterval = setInterval(() => {
      const newTime = calculateTimeLeft(TARGET_DATE);
      setTime(newTime);

      if (
        newTime.days <= 0 &&
        newTime.hours <= 0 &&
        newTime.minutes <= 0 &&
        newTime.seconds <= 0
      ) {
        clearInterval(timeInterval);
      }

      return () => clearInterval(timeInterval);
    }, 1000);
  }, []);

  if (!time)
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 my-20">
        <div className="flex flex-col gap-2 justify-center">
          <h3 className="text-3xl font-bold">Loading countdown...</h3>
        </div>
      </section>
    );

  if (
    time.days <= 0 &&
    time.hours <= 0 &&
    time.minutes <= 0 &&
    time.seconds <= 0
  ) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 my-20">
        <div className="flex flex-col gap-2 justify-center">
          <h3 className="text-3xl font-bold">Deal has ended</h3>
          <p>
            This deal is no longer available. Check out our latest promotions!
          </p>

          <div className="text-center">
            <Button asChild>
              <Link href="/search">View Products</Link>
            </Button>
          </div>
        </div>
        <div className="flex justify-center">
          <Image src={promo} alt="Deal of the month" width={300} height={200} />
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 my-20">
      <div className="flex flex-col gap-2 justify-center">
        <h3 className="text-3xl font-bold">Deal Of The Month</h3>
        <p>
          Get ready for a shopping experience like never before with our Deals
          of the Month! Every purchase comes with exclusive perks and offers,
          making this month a celebration of savvy choices and amazing deals.
          Don&apos;t miss out! 🎁🛒
        </p>
        <ul className="grid grid-cols-4">
          <StatBox label="Days" value={time.days} />
          <StatBox label="Hours" value={time.hours} />
          <StatBox label="Minutes" value={time.minutes} />
          <StatBox label="Seconds" value={time.seconds} />
        </ul>
        <div className="text-center">
          <Button asChild>
            <Link href="/search">View Products</Link>
          </Button>
        </div>
      </div>
      <div className="flex justify-center">
        <Image src={promo} alt="Deal of the month" width={300} height={200} />
      </div>
    </section>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <li className="p-4 w-full text-center">
    <p className="text-3xl font-bold">{value}</p>
    <p>{label}</p>
  </li>
);

export default DealCountdown;
