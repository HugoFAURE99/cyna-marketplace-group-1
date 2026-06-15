const searchBar = {
    action: '/search',
}

export default function SearchBar() {
    return (
        <form action={searchBar.action} method="POST">
            <input type="search" name="query" placeholder="Search..." className="border rounded-2xl px-4 py-2 w-250 focus:outline-none focus:ring-2 bg-gray-50" />
        </form>
    )
}