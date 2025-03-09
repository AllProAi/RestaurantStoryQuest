import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().min(1, "Please enter your username"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [_, setLocation] = useLocation();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Store token and user info
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      // Redirect based on user role
      if (result.user.role === 'admin') {
        setLocation('/dashboard');
      } else {
        setLocation('/home');  // Changed from /questionnaire to /home
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-center text-[#006400]">
                Welcome Back
              </h1>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-[#009B3A] hover:bg-[#006400]"
                  >
                    Login
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}