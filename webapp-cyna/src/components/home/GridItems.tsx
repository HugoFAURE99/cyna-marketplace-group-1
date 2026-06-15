const prodCategories = [
    {
        id: 1,
        name: 'SOC Solutions',
        href: "/"
    },
    {
        id: 2,
        name: 'EDR Solutions',
        href: "/"
    },
    {
        id: 3,
        name: 'XDR Solutions',
        href: "/"
    },
    {
        id: 4,
        name: 'Threat Intelligence',
        href: "/"
    },
    {
        id: 5,
        name: 'Cloud Security',
        href: "/"
    },
    {
        id: 6,
        name: 'Compliance Tools',
        href: "/"
    }
]

interface GridItemsProps {
    headerText?: string;
    titleText?: string;
    viewAllLink?: string;
}

export default function GridItems({
    headerText = "",
    titleText = "",
    viewAllLink = ""
}: GridItemsProps) {
    return (
        <div className="flex justify-center">
            <div className="p-5">
                <div className="flex justify-between mb-4 mb-8">
                    <div>
                        <h1 className="text-purple-800 font-bold mb-5">{headerText}</h1>
                        <p className="text-2xl font-bold">{titleText}</p>
                    </div>
                    <div>
                        <a href={viewAllLink} className="text-gray-400 hover:text-purple-500 transition-colors duration-300">View All →</a>
                    </div>
                </div>
                <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-150 w-300">
                    {prodCategories.map((category) => (
                        <div key={category.id} className="bg-white shadow-lg p-10 rounded-2xl p-6 hover:shadow-xl transition-shadow duration-300 relative">
                            <a href={category.href}>
                                <p className="absolute bottom-4 left-4">{category.name}</p>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}