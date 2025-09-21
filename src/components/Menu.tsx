import Link from "next/link";
import Image from "next/image";

const menuItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Home",
        href: "/",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible:["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/course.png",
        label: "Courses",
        href: "/list/courses",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
       {
        icon: "/topic.png",
        label: "Topics",
        href: "/list/topics",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      
      {
        icon: "/test.png",
        label: "Tests",
        href: "/list/tests",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
    ],
  },
  {
    title: "OTHER",
    items: [
      {
        icon: "/profile.png",
        label: "Profile",
        href: "/profile",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["Owner", "SuperAdmin",  "Admin", "Teacher", "Student", "Parent"],
      },
    ],
  },
];

const Menu = () =>{
  return(
    <div className="mt-4 text-sm">
      {
        menuItems.map(i =>(
          <div className="flex flex-col gap-2" key={i.title}>
            <span className="hidden lg:block text-gray-400 font-light my-4">{i.title}</span>
            {i.items.map(item =>(
              <Link href = {item.href} key = {item.label} className="flex item-center justify-center lg:justify-start gap-4 text-gray-500 py-2 ">
                <Image src ={item.icon} alt = "" width={20} height = {20}/>
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            ))}
          </div>
        ))
      }
    </div>
  )
}

export default Menu