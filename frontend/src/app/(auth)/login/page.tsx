"use client";

import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/utils/axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Initialize Validation Schema for Login by Zod
const loginSchema = z.object({
  email: z.string().email("Invalid Email format"),
  password: z.string().min(1, "Password cannot leave blank"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    try {
      // Send login request to backend
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      // Save Access Token to LocalStorage for future request to attach with Axios Interceptor
      const { access_token } = response.data;
      if (access_token) {
        localStorage.setItem("access_token", access_token);
      }

      toast.success("log in successful, going to the dashboard");
      router.push("/dashboard");
    } catch (err: unknown) {
      let errorMsg = "Log in failed! Please double check email and password";

      if (axios.isAxiosError(err)) {
        errorMsg = err.response?.data?.message || errorMsg;
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Log In
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<LoginFormInputs, "email">;
                }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="mikey@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-orange-500" />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<LoginFormInputs, "password">;
                }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-orange-500" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full font-bold mt-2"
                disabled={loading}
              >
                {loading ? "Validating..." : "Login now"}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Have not got account yet?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign up for a new account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
