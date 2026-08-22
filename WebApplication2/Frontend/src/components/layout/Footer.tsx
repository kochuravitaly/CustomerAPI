export default function Footer() {
    return (
        <footer className="border-t bg-white">
            <div className="mx-auto max-w-7xl px-6 py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} CustomerAPI. All rights reserved.
            </div>
        </footer>
    );
}