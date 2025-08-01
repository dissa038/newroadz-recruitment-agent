"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import TimeRangePicker from "@/components/ui/time-range-picker";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { contactSchema, type ContactFormData } from "@/lib/validations";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { fadeUp, staggerContainer, staggerChild } from "@/lib/animations";

export function ContactForm() {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      projectType: "",
      budget: "",
      timeline: "",
      preferredStartDate: "",
      preferredStartTime: null,
      projectDeadline: "",
      availabilityDateRange: { startDate: null, endDate: null },
      availabilityTimeRange: { startTime: null, endTime: null },
      message: "",
      acceptTerms: false,
      newsletter: false,
    } as ContactFormData,
  });

  const onSubmit: SubmitHandler<ContactFormData> = (data) => {
    console.log("Form data:", data);

    toast({
      title: "Bericht verzonden! 🎉",
      description: "We nemen binnen 24 uur contact met je op.",
    });

    form.reset();
  };

  return (
    <section id="contact" className="py-32 bg-gradient-to-br from-muted/30 via-background to-muted/20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-16"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h2 
              variants={staggerChild}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Laten we samen bouwen
            </motion.h2>
            <motion.p 
              variants={staggerChild}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Vertel ons over je project en ontdek hoe we je kunnen helpen met moderne web development.
            </motion.p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
          >
            <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">Project Aanvraag</CardTitle>
              <CardDescription className="text-lg">
                Vul onderstaand formulier in en we nemen snel contact met je op
              </CardDescription>

              {/* Silk BottomSheet voor FAQ */}
              <div className="mt-4">
                <BottomSheet
                  trigger={
                    <Button variant="outline" size="sm">
                      ❓ Veelgestelde vragen
                    </Button>
                  }
                  title="Veelgestelde Vragen"
                  description="Alles wat je wilt weten over ons ontwikkelproces"
                >
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Hoe snel krijg ik een reactie?</h4>
                      <p className="text-muted-foreground">We reageren binnen 24 uur op alle project aanvragen.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Wat gebeurt er na het versturen?</h4>
                      <p className="text-muted-foreground">We plannen een gratis intake gesprek om je project te bespreken en een offerte op maat te maken.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Zijn er kosten verbonden aan de intake?</h4>
                      <p className="text-muted-foreground">Nee, het eerste gesprek en de offerte zijn altijd gratis en vrijblijvend.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Welke informatie heb je nodig?</h4>
                      <p className="text-muted-foreground">Hoe meer details je deelt over je project, doelen en wensen, hoe beter we je kunnen helpen.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Hoe werkt het ontwikkelproces?</h4>
                      <p className="text-muted-foreground">Na de intake maken we een projectplan met duidelijke mijlpalen en deadlines. Je blijft altijd op de hoogte van de voortgang.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Kan ik wijzigingen aanbrengen tijdens het project?</h4>
                      <p className="text-muted-foreground">Ja, we werken agile en kunnen flexibel omgaan met wijzigingen. Grote aanpassingen bespreken we altijd vooraf.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Wat voor ondersteuning krijg ik na oplevering?</h4>
                      <p className="text-muted-foreground">We bieden altijd een garantieperiode en kunnen doorlopende ondersteuning en onderhoud verzorgen.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Werken jullie met vaste prijzen?</h4>
                      <p className="text-muted-foreground">We maken altijd een gedetailleerde offerte met vaste prijzen per onderdeel, zodat je precies weet waar je aan toe bent.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Kan ik referenties zien van eerdere projecten?</h4>
                      <p className="text-muted-foreground">Natuurlijk! We delen graag voorbeelden van ons werk en kunnen je in contact brengen met tevreden klanten.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Hoe zit het met eigendom van de code?</h4>
                      <p className="text-muted-foreground">Na volledige betaling is alle code en intellectueel eigendom 100% van jou. Je krijgt ook alle bronbestanden.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Welke technologieën gebruiken jullie?</h4>
                      <p className="text-muted-foreground">We werken met moderne technologieën zoals React, Next.js, TypeScript, Node.js en verschillende databases afhankelijk van je projectbehoeften.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Hoe lang duurt een gemiddeld project?</h4>
                      <p className="text-muted-foreground">Dit hangt af van de complexiteit, maar de meeste projecten duren tussen de 4-12 weken. We geven altijd een realistische planning vooraf.</p>
                    </div>
                  </div>
                </BottomSheet>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Persoonlijke informatie */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Persoonlijke Informatie</h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Voornaam *</FormLabel>
                            <FormControl>
                              <Input placeholder="Je voornaam" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Achternaam *</FormLabel>
                            <FormControl>
                              <Input placeholder="Je achternaam" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mailadres *</FormLabel>
                            <FormControl>
                              <Input placeholder="je@email.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefoonnummer</FormLabel>
                            <FormControl>
                              <Input placeholder="+31 6 12345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Project details */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Project Details</h3>

                    <div className="grid md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="projectType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecteer type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="webapp">Web Applicatie</SelectItem>
                                <SelectItem value="ecommerce">E-commerce</SelectItem>
                                <SelectItem value="mobile">Mobile App</SelectItem>
                                <SelectItem value="api">API Development</SelectItem>
                                <SelectItem value="other">Anders</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Budget Range *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecteer budget" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="5k-10k">€5.000 - €10.000</SelectItem>
                                <SelectItem value="10k-25k">€10.000 - €25.000</SelectItem>
                                <SelectItem value="25k-50k">€25.000 - €50.000</SelectItem>
                                <SelectItem value="50k-100k">€50.000 - €100.000</SelectItem>
                                <SelectItem value="100k+">€100.000+</SelectItem>
                                <SelectItem value="discuss">Te bespreken</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="timeline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeline *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecteer timeline" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="asap">Zo snel mogelijk</SelectItem>
                                <SelectItem value="1-month">Binnen 1 maand</SelectItem>
                                <SelectItem value="3-months">Binnen 3 maanden</SelectItem>
                                <SelectItem value="6-months">Binnen 6 maanden</SelectItem>
                                <SelectItem value="flexible">Flexibel</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Custom Pickers Demonstratie */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Planning & Beschikbaarheid</h3>
                    <p className="text-sm text-muted-foreground">
                      Demonstratie van alle 4 de custom pickers: DatePicker, TimePicker, DateRangePicker en TimeRangePicker
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="preferredStartDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gewenste Startdatum * (DatePicker)</FormLabel>
                            <FormControl>
                              <DatePicker
                                selectedDate={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Custom DatePicker component
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferredStartTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gewenste Starttijd (TimePicker)</FormLabel>
                            <FormControl>
                              <TimePicker
                                selectedTime={field.value ?? null}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Custom TimePicker component
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="projectDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Deadline (DatePicker)</FormLabel>
                          <FormControl>
                            <DatePicker
                              selectedDate={field.value || ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Optioneel: Wanneer moet het project klaar zijn?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availabilityDateRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beschikbaarheid Periode (DateRangePicker)</FormLabel>
                          <FormControl>
                            <DateRangePicker
                              dateRange={field.value || { startDate: null, endDate: null }}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Custom DateRangePicker - selecteer een periode waarin je beschikbaar bent
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availabilityTimeRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beschikbaarheid Tijden (TimeRangePicker)</FormLabel>
                          <FormControl>
                            <TimeRangePicker
                              timeRange={field.value || { startTime: null, endTime: null }}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Custom TimeRangePicker - selecteer je beschikbare tijden per dag
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Project Beschrijving</h3>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vertel ons over je project *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Beschrijf je project, doelen, gewenste functionaliteiten, en alles wat je belangrijk vindt om te delen..."
                              className="min-h-[150px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Hoe meer details je deelt, hoe beter we je kunnen helpen.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold border-b pb-2">Voorwaarden & Voorkeuren</h3>

                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Ik accepteer de algemene voorwaarden *
                            </FormLabel>
                            <FormDescription>
                              Door dit vakje aan te vinken ga je akkoord met onze{" "}
                              <a href="#" className="text-primary hover:underline">
                                algemene voorwaarden
                              </a>{" "}
                              en{" "}
                              <a href="#" className="text-primary hover:underline">
                                privacybeleid
                              </a>
                              .
                            </FormDescription>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newsletter"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Houd me op de hoogte van nieuws en updates
                            </FormLabel>
                            <FormDescription>
                              Ontvang onze maandelijkse nieuwsbrief met tips, tutorials en project updates.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Submit */}
                  <div className="pt-6">
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button type="submit" size="lg" className="w-full text-lg py-6">
                          Verstuur Project Aanvraag
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verzend hier je formulier.</p>
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      We nemen binnen 24 uur contact met je op om je project te bespreken.
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}