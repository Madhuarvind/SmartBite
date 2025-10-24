
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Projector, Cpu, Sprout, GitBranch, BrainCircuit, ShieldCheck, Zap } from "lucide-react";
import Image from "next/image";
import { ForkAndLeaf } from "@/components/icons";

export default function AuraPage() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <PageHeader title="Project Aura: The Conscious Kitchen" />

      <Card className="animate-fade-in-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center text-primary">
            <ForkAndLeaf className="w-8 h-8 mr-3" />
            A Vision for the Fully Autonomous Kitchen Ecosystem
          </CardTitle>
          <CardDescription>
            Project Aura represents the physical manifestation of SmartBite's "Kitchen Consciousness" engine. It's a conceptual hardware ecosystem designed to create a zero-effort, hyper-aware, and predictive environment that seamlessly guides you toward a sustainable lifestyle. Aura bridges the gap between the digital intelligence of SmartBite and the physical reality of your kitchen.
          </CardDescription>
        </CardHeader>
      </Card>

      <h2 className="text-2xl font-bold tracking-tight border-b pb-2">Component Specifications</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.1s'}}>
          <CardHeader>
            <Projector className="w-10 h-10 mb-4 text-primary" />
            <CardTitle>Aura Rail</CardTitle>
            <CardDescription>Intelligent Backsplash Command Hub</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The central nervous system of the kitchen, the Rail projects an interactive UI onto your countertop and serves as the communication hub for all Aura devices.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Interactive Projection:</strong> A short-throw pico-projector displays recipes, inventory data, and video guides directly on your work surface.</li>
              <li><strong>Gesture Control:</strong> A time-of-flight (ToF) camera enables touchless navigation, keeping screens clean during messy food prep.</li>
              <li><strong>Inductive Charging:</strong> An integrated charging strip wirelessly powers the Aura Knife and other peripherals.</li>
              <li><strong>Processing Core:</strong> Runs a lightweight edge-computing model for real-time gesture recognition and local command processing.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.2s'}}>
          <CardHeader>
            <Cpu className="w-10 h-10 mb-4 text-primary" />
            <CardTitle>Aura Knife</CardTitle>
            <CardDescription>Onboard Spectroscopic Food Analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              A revolutionary culinary tool that performs real-time chemical analysis of food as you prepare it, providing unprecedented insight into freshness and composition.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Embedded NIR Spectrometer:</strong> A miniaturized near-infrared sensor analyzes the molecular structure of food to determine ripeness, sugar content, and protein levels.</li>
              <li><strong>Spoilage Detection:</strong> Identifies the chemical markers of decay, providing a definitive "edibility score" far more accurate than a simple date.</li>
              <li><strong>Real-time Nutrient Logging:</strong> Automatically logs the precise nutritional value of ingredients as they are prepped for a meal.</li>
              <li><strong>BLE Connectivity:</strong> Transmits data instantly to the Aura Rail and the SmartBite cloud.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.3s'}}>
          <CardHeader>
            <Sprout className="w-10 h-10 mb-4 text-primary" />
            <CardTitle>Gecko Sensors</CardTitle>
            <CardDescription>Ambient Inventory & Environment Trackers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Thin, adhesive, energy-harvesting sensors that create a complete, real-time digital twin of your pantry and fridge.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li><strong>Multi-modal Sensing:</strong> Combines flexible load cells (for weight), capacitance arrays (for volume), and IR break-beams (for item counts).</li>
              <li><strong>Ethylene Gas Detection:</strong> A BME680 sensor monitors VOCs, specifically the ethylene gas released by ripening fruit, to predict spoilage across the entire pantry.</li>
              <li><strong>Energy Harvesting:</strong> Powered by small, indoor-light solar cells, eliminating the need for batteries and reducing electronic waste.</li>
              <li><strong>Mesh Networking:</strong> Uses Bluetooth Mesh to create a resilient network that reports all inventory changes instantly.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

       <Card className="animate-fade-in-slide-up" style={{animationDelay: '0.4s'}}>
        <CardHeader>
            <CardTitle className="flex items-center"><GitBranch className="mr-3"/>The Aura Network: System Synergy</CardTitle>
            <CardDescription>How Aura components work in concert to create a seamless, intelligent kitchen experience.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                    <Image 
                        src="https://picsum.photos/seed/aura-network/600/400"
                        alt="Aura System Diagram"
                        width={600}
                        height={400}
                        className="rounded-lg border shadow-md"
                        data-ai-hint="futuristic kitchen network diagram"
                    />
                </div>
                <div className="flex-1 space-y-4">
                    <p>
                        Imagine you pick up an avocado. A **Gecko Sensor** on the fruit bowl detects the change in weight and instantly updates its status in your SmartBite inventory. You place it on your cutting board, and the **Aura Rail** projects a suggestion: "This avocado is perfectly ripe! Make Guacamole?"
                    </p>
                    <p>
                        You slice into it with the **Aura Knife**. Its spectrometer confirms peak freshness and provides its exact caloric content, logging it to your daily health tracker. The **Aura Rail** interface, controlled by your gestures, displays a recipe on the counter. As you use ingredients, your digital inventory is automatically and precisely deducted. This is the vision of Project Aura: a frictionless, conscious system.
                    </p>
                </div>
            </div>
        </CardContent>
       </Card>

      <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 animate-fade-in-slide-up" style={{animationDelay: '0.5s'}}>
            <CardHeader>
                <CardTitle className="flex items-center"><BrainCircuit className="mr-3"/>The Data-to-Consciousness Feedback Loop</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="mb-4">The "Kitchen Consciousness" is not just an abstract idea; it's a tangible feedback loop fueled by the data from Project Aura.</p>
                <ol className="list-decimal pl-5 space-y-2">
                    <li><strong>Data Capture:</strong> **Gecko Sensors** and the **Aura Knife** passively collect high-fidelity data on inventory levels, ingredient freshness, and actual usage.</li>
                    <li><strong>Cloud Analysis:</strong> This data stream is fed into the SmartBite AI backend, where Genkit flows analyze patterns, predict waste, and model your "consciousness drift."</li>
                    <li><strong>Proactive Intervention:</strong> The AI sends insights back to the user through two channels:
                        <ul className="list-disc pl-6 mt-2">
                            <li>**Digital:** Proactive nudges, recipe suggestions, and warnings within the SmartBite app.</li>
                            <li>**Physical:** Context-aware suggestions and alerts projected directly onto your workspace by the **Aura Rail**.</li>
                        </ul>
                    </li>
                    <li><strong>Learning & Evolution:</strong> The system observes your response to its interventions, learning your preferences and becoming a more effective partner over time.</li>
                </ol>
            </CardContent>
          </Card>
          <div className="space-y-6 animate-fade-in-slide-up" style={{animationDelay: '0.6s'}}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Zap className="mr-3"/>Key Innovations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <p><strong>Zero-Effort Data Capture:</strong> Automates inventory management, eliminating the need for manual scanning.</p>
                    <p><strong>Ambient Food Analysis:</strong> Moves food analysis from the lab to the cutting board, providing real-time data.</p>
                    <p><strong>Predictive Intervention:</strong> The system doesn't just report data; it anticipates needs and intervenes to prevent waste.</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><ShieldCheck className="mr-3"/>The Goal: A Resilient, Zero-Waste Kitchen</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Project Aura aims to make sustainable living the path of least resistance, creating a kitchen that intelligently manages its own resources and helps you live a healthier, more affordable, and eco-conscious life.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    