"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ControllerRenderProps, useForm } from "react-hook-form";
import api from '@/utils/axios';
import * as z from "zod";
import toast from "react-hot-toast";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import axios from "axios";

const signupSchema = z
  .object({
    email: z.string().email("Incorrect email format (have to have @gmail.com)"),
    password: z.string().min(6, "Password has to contain minimum 6 character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mismatched Passwords, reconfirm password",
    path: ["confirmPassword"], // to address the input box that has the error
  });

// extract data types from Schema for React Hook Form to use
type SignupFormInputs = z.infer<typeof signupSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SignupFormInputs>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupFormInputs) => {
    setLoading(true);
    try {
        //Call signup(register) API endpoint from NestJS
        await api.post('/auth/register', {
            email: data.email,
            password: data.password,
        });

        toast.success("Sign up Successfully! Welcome new Author, Log in to continue!")

        router.push('/login');
    } catch (err: unknown) {
        let errorMsg = "Sign up failed, please try again";

        if (axios.isAxiosError(err)) {
            errorMsg = err.response?.data?.message || errorMsg;
        }else if (err instanceof Error) {
            errorMsg = err.message;
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
          <CardTitle className="text-2xl font-bold tracking-tight">Sign Up</CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Use Wrapper Form from Shadcn to sync state between Error state and Accessibility */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: ControllerRenderProps<SignupFormInputs, 'email'> }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="mikey@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage className="text-orange-500" />
                  </FormItem>
                )}
              />

              {/* Password Field */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: ControllerRenderProps<SignupFormInputs, 'password'> }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage className="text-orange-500" />
                  </FormItem>
                )}
              />

              {/* Confirm Password Field */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }: { field: ControllerRenderProps<SignupFormInputs, 'confirmPassword'> }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Confirm your password</FormLabel>
                    <FormControl>
                      <Input placeholder="••••••••" type="password" {...field} />
                    </FormControl>
                    <FormMessage className="text-orange-500" />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full font-bold" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  'Sign Up Now'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already had an account?{' '}
            <Link href="/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
              Log in to your account
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
