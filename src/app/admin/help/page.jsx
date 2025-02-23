import Link from "next/link";
import { Mail, Github, Smartphone } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const developers = [
  {
    name: "Vaibhav Katariya",
    role: "Full Stack Developer",
    github: "vaibhavkatariya",
    email: "vaibhav@kaily.in",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER1,
  },
  {
    name: "Himanshu Singh",
    role: "Frontend Developer && UI/UX Designer",
    github: "Himaanshuuuu04",
    email: "himan0411singh@gmail.com",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER2,
  },
  {
    name: "Vansh Arora",
    role: "Backend Developer",
    github: "vansh1293",
    email: "aroravansh.com@gmail.com",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER3,
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Need Help?</h1>
          <p className="text-xl text-gray-300 mb-8">Don't worry, we've got your back!</p>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our team is here to assist you with any questions or issues you might have. Feel free to reach out to any of
            our team members listed below for support.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-semibold mb-6 text-center">Our Support Team</h2>
          <div className="overflow-x-auto bg-black rounded-lg shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>GitHub</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {developers.map((dev) => (
                  <TableRow key={dev.github}>
                    <TableCell className="font-medium">{dev.name}</TableCell>
                    <TableCell>{dev.role}</TableCell>
                    <TableCell>
                      <Link
                        href={`https://github.com/${dev.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-300 hover:text-blue-200 flex items-center"
                      >
                        <Github className="h-4 w-4 mr-1" />
                        {dev.github}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`mailto:${dev.email}`}
                        className="text-blue-300 hover:text-blue-200 flex items-center"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        {dev.email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {dev.whatsapp ? (
                        <Link
                          href={`https://wa.me/${dev.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:text-blue-200 flex items-center"
                        >
                          <Smartphone className="h-4 w-4 mr-1" />
                          {dev.whatsapp}
                        </Link>
                      ) : (
                        <span className="text-gray-400">Hidden</span> // Placeholder text
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="text-center mt-16">
          <h2 className="text-2xl font-semibold mb-4">Credits</h2>
          <p className="text-gray-400">
          his project was made possible by the hard work and dedication of our talented team.
          </p>
        </section>
      </main>
    </div>
  );
}
