"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Projector, Beaker, Sprout, Cpu, CpuIcon } from "lucide-react";
import Image from "next/image";
import { ForkAndLeaf } from "@/components/icons";

export default function AuraPage() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Project Aura" />

      <Card className="animate-fade-in-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <ForkAndLeaf className="w-8 h-8 mr-3" />
            The Future of the Sustainable Kitchen
          </CardTitle>
          <CardDescription>
            Project Aura represents the next evolution of SmartBite—an integrated hardware and software ecosystem designed to create a zero-waste, intelligent kitchen environment. This page outlines the conceptual hardware components that work with the SmartBite app to provide unparalleled insights and control.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
          <CardHeader>
            <Projector className="w-10 h-10 mb-4 text-primary" />
            <CardTitle>Aura Rail</CardTitle>
            <CardDescription>Intelligent Backsplash Hub</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The Aura Rail is the central command unit, mounted on your kitchen backsplash. It uses a short-throw pico-projector to display a fully interactive SmartBite UI directly onto your countertop.
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-sm">
              <li><strong>Interactive Projection:</strong> Displays recipes, inventory, and video guides on your work surface.</li>
              <li><strong>Gesture Control:</strong> A time-of-flight (ToF) camera allows you to navigate the interface with simple hand gestures, keeping screens clean.</li>
              <li><strong>Wireless Charging:</strong> Features an integrated inductive charging strip to wirelessly power other Aura devices like the Aura Knife.</li>
              <li><strong>Central Hub:</strong> Connects all Aura sensors and devices to the SmartBite cloud.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.2s'}}>
          <CardHeader>
            <CpuIcon className="w-10 h-10 mb-4 text-primary" />
            <CardTitle>Aura Knife</CardTitle>
            <CardDescription>Onboard Food Analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A revolutionary culinary tool that analyzes food in real-time. As you chop, the Aura Knife provides instant data on freshness, composition, and ripeness.
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-sm">
              <li><strong>Embedded Spectrometer:</strong> A miniaturized near-infrared (NIR) spectrometer in the handle analyzes the chemical makeup of food.</li>
              <li><strong>Freshness Detection:</strong> Instantly know if a fruit is perfectly ripe or if meat is beginning to spoil.</li>
              <li><strong>Nutrient Analysis:</strong> Get real-time estimates of macros and calorie content for the food you are preparing.</li>
              <li><strong>Bluetooth Connected:</strong> Transmits data to the Aura Rail and your SmartBite app, updating your meal log as you cook.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.3s'}}>
          <CardHeader>
            <Sprout className="w-10 h-10 mb-4 text-primary" />
            <CardTitle>Gecko Sensors</CardTitle>
            <CardDescription>Ambient Inventory Trackers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thin, adhesive, and energy-harvesting sensors that you can stick to any container or surface to automate inventory tracking with unprecedented accuracy.
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-sm">
              <li><strong>Weight & Volume Sensing:</strong> Flexible load cells and capacitance sensors measure the remaining quantity of liquids, grains, and other items.</li>
              <li><strong>Environmental Monitoring:</strong> A BME680 sensor detects temperature, humidity, and VOCs like ethylene gas to monitor the freshness of produce.</li>
              <li><strong>Energy Harvesting:</strong> Powered by small, indoor-light solar cells, eliminating the need for batteries.</li>
              <li><strong>Effortless Tracking:</strong> Your inventory is updated automatically and in real-time, no scanning required.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

       <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.4s'}}>
        <CardHeader>
            <CardTitle>System Synergy</CardTitle>
            <CardDescription>How Aura components work together to create a seamless, sustainable kitchen experience.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 space-y-4">
                    <p>
                        Imagine you pick up an avocado. A **Gecko Sensor** on the fruit bowl updates its status in your inventory. You place it on your cutting board, and the **Aura Rail** projects a suggestion: "This avocado is perfectly ripe! Make Guacamole?"
                    </p>
                    <p>
                        You slice into it with the **Aura Knife**, and its spectrometer confirms peak freshness and provides its exact caloric content. The **Aura Rail** interface, controlled by your gestures, displays a recipe next to your workspace. As you use ingredients, your digital inventory is automatically deducted.
                    </p>
                    <p>
                        This is the vision of Project Aura: a frictionless system that provides the right information at the right time, making it effortless to eliminate waste and live more sustainably.
                    </p>
                </div>
                 <div className="flex-1">
                    <Image 
                        src="https://picsum.photos/seed/aura/600/400"
                        alt="Aura System Diagram"
                        width={600}
                        height={400}
                        className="rounded-lg border shadow-md"
                        data-ai-hint="futuristic kitchen diagram"
                    />
                </div>
            </div>
        </CardContent>
       </Card>
    </div>
  );
}
