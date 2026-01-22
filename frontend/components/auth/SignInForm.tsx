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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "@/lib/auth-client";
import { Spinner } from "../ui/spinner";
import { Separator } from "../ui/separator";

const formSchema = z.object({
  email: z.email("Enter a valid email adress"),
  password: z.string().min(6, "Enter a valid password"),
});

export function SignInForm() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await signIn.email(
        {
          email: data.email,
          password: data.password,
          callbackURL: "/",
        },
        // {
        //   onSuccess: async () => {
        //     const { error } = await twoFactor.sendOtp({});

        //     if (error) {
        //       toast.error(error.message);
        //     }

        //     router.push("/two-factor");
        //   },
        //   onError: (ctx) => {
        //     toast.error(ctx.error.message);
        //   },
        // }
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
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="signin-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FieldGroup>
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
                  <FieldLabel className="flex items-center justify-between">
                    <span>Password</span>
                    <Link
                      className="text-blue-600 cursor-pointer"
                      href="/request-password"
                    >
                      Forgot password
                    </Link>
                  </FieldLabel>
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
            form="signin-form"
            className="cursor-pointer w-full"
          >
            {form.formState.isSubmitting ? (
              <Spinner className="size-6" />
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="text-sm flex items-center gap-1">
            Do not have an account?{" "}
            <Link href="/sign-up" className="text-blue-500">
              {" "}
              Sign up
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