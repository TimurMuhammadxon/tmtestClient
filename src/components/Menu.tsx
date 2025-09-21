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
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/teacher.png",
        label: "Teachers",
        href: "/list/teachers",
        visible: ["owner", "admin", "teacher"],
      },
      {
        icon: "/student.png",
        label: "Students",
        href: "/list/students",
        visible: ["owner", "admin", "teacher"],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: ["owner","admin"],
      },
      {
        icon: "/course.png",
        label: "Courses",
        href: "/list/courses",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/subject.png",
        label: "Subjects",
        href: "/list/subjects",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
       {
        icon: "/topic.png",
        label: "Topics",
        href: "/list/topics",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      
      {
        icon: "/test.png",
        label: "Tests",
        href: "/list/tests",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/lesson.png",
        label: "Lessons",
        href: "/list/lessons",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/exam.png",
        label: "Exams",
        href: "/list/exams",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/result.png",
        label: "Results",
        href: "/list/results",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/calendar.png",
        label: "Events",
        href: "/list/events",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/message.png",
        label: "Messages",
        href: "/list/messages",
        visible: ["owner", "admin", "teacher", "student", "parent"],
      },
      {
        icon: "/announcement.png",
        label: "Announcements",
        href: "/list/announcements",
        visible: ["owner", "admin", "teacher", "student", "parent"],
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
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/setting.png",
        label: "Settings",
        href: "/settings",
        visible: ["admin", "teacher", "student", "parent"],
      },
      {
        icon: "/logout.png",
        label: "Logout",
        href: "/logout",
        visible: ["admin", "teacher", "student", "parent"],
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