"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// Input component is no longer used directly for the file upload UI, but kept for other potential uses.
// import { Input } from "@/components/ui/input"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloudIcon, PillIcon, LanguagesIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Español (Spanish)" },
  { value: "fr", label: "Français (French)" },
  { value: "de", label: "Deutsch (German)" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "pt", label: "Português (Portuguese)" },
  { value: "ru", label: "Русский (Russian)" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "te", label: "తెలుగు (Telugu)" },
];

const imageUploadSchema = z.object({
  image: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "Image is required.")
    .refine(
      (files) => files?.[0]?.size <= 5 * 1024 * 1024, // 5MB limit
      "Max image size is 5MB."
    )
    .refine(
      (files) =>
        files && ["image/jpeg", "image/png", "image/webp"].includes(files[0].type),
      "Only .jpg, .png, .webp formats are supported."
    ),
  language: z.string().min(1, "Language is required."),
});

type ImageUploadFormValues = z.infer<typeof imageUploadSchema>;

interface ImageUploadFormProps {
  onSubmit: (data: { photoDataUri: string; language: string }) => Promise<void>;
  isLoading: boolean;
}

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function ImageUploadForm({ onSubmit, isLoading }: ImageUploadFormProps) {
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const form = useForm<ImageUploadFormValues>({
    resolver: zodResolver(imageUploadSchema),
    defaultValues: {
      language: "te", 
      image: undefined, // Initialize image field for RHF
    },
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    rhfOnChange: (value: FileList | null) => void
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      rhfOnChange(files); // Update RHF
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      rhfOnChange(new DataTransfer().files); // Update RHF with an empty FileList if no file or selection cancelled
    }
  };

  const processSubmit = async (values: ImageUploadFormValues) => {
    if (!values.image || values.image.length === 0) return;
    const photoDataUri = await fileToDataUri(values.image[0]);
    await onSubmit({ photoDataUri, language: values.language });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <PillIcon className="h-7 w-7 text-primary" />
          Identify Your Medicine
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Tablet Sheet Image</FormLabel>
                  <FormControl>
                    <div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="sr-only" // Visually hide the default input
                        onChange={(e) => handleFileChange(e, field.onChange)}
                        ref={field.ref}
                        name={field.name}
                        onBlur={field.onBlur}
                      />
                      <label
                        htmlFor="image-upload"
                        className={cn(
                          "mt-1 flex flex-col justify-center items-center w-full rounded-md border-2 border-dashed cursor-pointer",
                          "border-muted-foreground/30 hover:border-primary/70 bg-card hover:bg-muted/20",
                          "transition-colors duration-150 ease-in-out",
                          imagePreview ? "p-4" : "h-48 p-6"
                        )}
                      >
                        {imagePreview ? (
                          <div className="text-center">
                            <Image
                              src={imagePreview}
                              alt="Image preview"
                              width={160}
                              height={160}
                              className="rounded-md object-contain aspect-square mx-auto"
                              data-ai-hint="tablet image"
                            />
                            <span className="mt-2 block text-sm text-muted-foreground">
                              Click to change image
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1 text-center">
                            <UploadCloudIcon className="mx-auto h-12 w-12 text-muted-foreground/70" />
                            <div className="flex text-sm text-muted-foreground justify-center">
                              <span className="font-medium text-primary">
                                Click to upload
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, WEBP up to 5MB
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <LanguagesIcon className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Select language for results" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading || !form.formState.isValid} className="w-full text-lg py-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Identifying...
                </>
              ) : (
                "Identify Medicine"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}