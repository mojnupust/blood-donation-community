// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to your environment before running seed.");
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("Seeding started... 🌱");

  // ডেটাবেসে আগে থেকে কোনো ডেটা থাকলে তা মুছে ফেলবে (যাতে ডুপ্লিকেট না হয়)
  await prisma.donor.deleteMany();
  console.log("Cleared existing data.");

  // আপনার দেওয়া ৩০ টি রিয়েলিস্টিক ডেটা ইনসার্ট করা হচ্ছে
  await prisma.donor.createMany({
    data: [
      {
        name: "Abdur Rahman",
        fatherName: "Abdul Karim",
        village: "Shibrampur",
        union: "Dapunia",
        postOffice: "Dapunia",
        upazila: "Pabna Sadar",
        district: "Pabna",
        ssc: "2015",
        sscInst: "Pabna Zilla School",
        hsc: "2017",
        hscInst: "Pabna Govt College",
        degree: "BSc in CSE",
        degreeInst: "PUST",
        profession: "Web Developer",
        mobile: "01710000001",
        bloodGroup: "A+",
      },
      {
        name: "Mehedi Hasan",
        fatherName: "Mofiz Uddin",
        village: "Ataikula",
        union: "Ataikula",
        postOffice: "Ataikula",
        upazila: "Ishwardi",
        district: "Pabna",
        profession: "Teacher",
        mobile: "01710000002",
        bloodGroup: "B+",
      },
      {
        name: "Rakib Hossain",
        fatherName: "Abul Hossain",
        village: "Bera",
        district: "Pabna",
        profession: "Student",
        mobile: "01710000003",
        bloodGroup: "O+",
      },
      {
        name: "Tanvir Ahmed",
        fatherName: "Jalal Uddin",
        village: "Sujanagar",
        district: "Pabna",
        profession: "Bank Officer",
        mobile: "01710000004",
        bloodGroup: "AB+",
      },
      {
        name: "Sabbir Hossain",
        fatherName: "Rafiqul Islam",
        village: "Chatmohar",
        district: "Pabna",
        profession: "Engineer",
        mobile: "01710000005",
        bloodGroup: "A-",
      },
      {
        name: "Naim Islam",
        village: "Santhia",
        district: "Pabna",
        profession: "Doctor",
        mobile: "01710000006",
        bloodGroup: "B-",
      },
      {
        name: "Imran Khan",
        village: "Faridpur",
        district: "Pabna",
        profession: "Police Officer",
        mobile: "01710000007",
        bloodGroup: "O-",
      },
      {
        name: "Faisal Ahmed",
        village: "Bhangura",
        district: "Pabna",
        profession: "Businessman",
        mobile: "01710000008",
        bloodGroup: "AB-",
      },
      {
        name: "Saiful Islam",
        village: "Puthia",
        district: "Rajshahi",
        profession: "Teacher",
        mobile: "01710000009",
        bloodGroup: "A+",
      },
      {
        name: "Jahid Hasan",
        village: "Bagha",
        district: "Rajshahi",
        profession: "Farmer",
        mobile: "01710000010",
        bloodGroup: "B+",
      },
      {
        name: "Rony Ahmed",
        village: "Godagari",
        district: "Rajshahi",
        profession: "Driver",
        mobile: "01710000011",
        bloodGroup: "O+",
      },
      {
        name: "Shakib Ali",
        village: "Tanore",
        district: "Rajshahi",
        profession: "Student",
        mobile: "01710000012",
        bloodGroup: "AB+",
      },
      {
        name: "Mahmudul Hasan",
        village: "Dhamrai",
        district: "Dhaka",
        profession: "Software Engineer",
        mobile: "01710000013",
        bloodGroup: "A+",
      },
      {
        name: "Arif Hossain",
        village: "Savar",
        district: "Dhaka",
        profession: "Garments Officer",
        mobile: "01710000014",
        bloodGroup: "B+",
      },
      {
        name: "Nasir Uddin",
        village: "Keraniganj",
        district: "Dhaka",
        profession: "Lawyer",
        mobile: "01710000015",
        bloodGroup: "O+",
      },
      {
        name: "Hasibul Islam",
        village: "Nawabganj",
        district: "Dhaka",
        profession: "Journalist",
        mobile: "01710000016",
        bloodGroup: "AB+",
      },
      {
        name: "Mizanur Rahman",
        village: "Batiaghata",
        district: "Khulna",
        profession: "Engineer",
        mobile: "01710000017",
        bloodGroup: "A-",
      },
      {
        name: "Kamal Hossain",
        village: "Dacope",
        district: "Khulna",
        profession: "Businessman",
        mobile: "01710000018",
        bloodGroup: "B-",
      },
      {
        name: "Ashraful Islam",
        village: "Rangunia",
        district: "Chattogram",
        profession: "Teacher",
        mobile: "01710000019",
        bloodGroup: "O-",
      },
      {
        name: "Belal Hossain",
        village: "Sitakunda",
        district: "Chattogram",
        profession: "Marine Engineer",
        mobile: "01710000020",
        bloodGroup: "AB-",
      },
      {
        name: "Minhaz Uddin",
        village: "Gaibandha",
        district: "Gaibandha",
        profession: "Student",
        mobile: "01710000021",
        bloodGroup: "A+",
      },
      {
        name: "Habibur Rahman",
        village: "Bogura",
        district: "Bogura",
        profession: "Farmer",
        mobile: "01710000022",
        bloodGroup: "B+",
      },
      {
        name: "Shariful Islam",
        village: "Natore",
        district: "Natore",
        profession: "Doctor",
        mobile: "01710000023",
        bloodGroup: "O+",
      },
      {
        name: "Al Amin",
        village: "Sirajganj",
        district: "Sirajganj",
        profession: "Teacher",
        mobile: "01710000024",
        bloodGroup: "AB+",
      },
      {
        name: "Shahin Alam",
        village: "Kushtia",
        district: "Kushtia",
        profession: "Banker",
        mobile: "01710000025",
        bloodGroup: "A-",
      },
      {
        name: "Rashedul Islam",
        village: "Jessore",
        district: "Jashore",
        profession: "Engineer",
        mobile: "01710000026",
        bloodGroup: "B-",
      },
      {
        name: "Sumon Ahmed",
        village: "Barishal",
        district: "Barishal",
        profession: "Businessman",
        mobile: "01710000027",
        bloodGroup: "O-",
      },
      {
        name: "Zahidul Islam",
        village: "Cumilla",
        district: "Cumilla",
        profession: "Student",
        mobile: "01710000028",
        bloodGroup: "AB-",
      },
      {
        name: "Mamun Hossain",
        village: "Feni",
        district: "Feni",
        profession: "Teacher",
        mobile: "01710000029",
        bloodGroup: "A+",
      },
      {
        name: "Tariq Hasan",
        village: "Noakhali",
        district: "Noakhali",
        profession: "Doctor",
        mobile: "01710000030",
        bloodGroup: "B+",
      },
    ],
  });

  console.log("✅ 30 real-world sample donors seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
