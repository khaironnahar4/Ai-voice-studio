"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { toast } from "sonner";
import { signIn, signUp } from "@/lib/auth-client";
import { Spinner } from "../ui/spinner";
import { Separator } from "../ui/separator";

const formSchema = z
  .object({
    name: z.string().min(3, "Enter a valid name"),
    email: z.email("Enter a valid email adress"),
    password: z.string().min(6, "Enter a valid password"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export function SignUpForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await signUp.email(
        {
          name: data.name,
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: async () => {
            toast.success("Created your account successfully.");
            // toast.success("Please see your email to verify your account");
          },
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
        }
      );
    } catch {
      throw new Error("Something went wrong");
    }
  };

//   const signInWithGoogle = async () => {
//     await signIn.social({
//       provider: "google",
//       callbackURL: "/",
//     });
//   };

//   const signInWithGithub = async () => {
//     await signIn.social({
//       provider: "github",
//       callbackURL: "/",
//     });
//   };

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>Create an account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="signup-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    {...field}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    {...field}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    {...field}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    type="password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1">
                  <FieldLabel>Confirm password</FieldLabel>
                  <Input
                    {...field}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    type="password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col w-full">
        <Field
          orientation="horizontal"
          className="flex w-full items-center justify-between flex-col gap-2"
        >
          <Button
            type="submit"
            form="signup-form"
            className="cursor-pointer w-full"
          >
            {form.formState.isSubmitting ? (
              <Spinner className="size-6" />
            ) : (
              "Sign up"
            )}
          </Button>

          <p className="text-sm flex items-center gap-1">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-blue-500">
              {" "}
              Sign in
            </Link>
          </p>
        </Field>

        <div className="flex flex-col w-full my-6 items-center justify-center">
          <p className="text-sm">Or</p>
          <Separator className="gap-6 my-1" />
        </div>

        <div className="flex flex-col w-full gap-3">
          <Button
            type="button"
            className="text-sm cursor-pointer"
            // onClick={signInWithGoogle}
          >
            Continue with Google
          </Button>

          <Button
            type="button"
            className="text-sm cursor-pointer"
            // onClick={signInWithGithub}
          >
            Continue with Github
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}