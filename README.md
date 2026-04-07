# 🏦 Capital Quest: The Strategic Banking Simulation

Capital Quest is a polished, "game-like" banking simulation where you start from Year 1 and build your financial empire. Navigate market cycles, manage a diverse portfolio, and handle unexpected life events as you strive for the highest net worth.

## 🚀 Features

- **Yearly Progression:** Start from Year 1 and play through decades of market activity.
- **Investment Phases:** Allocate capital at the start of each year across various sectors (Technology, Energy, Healthcare, Consumer, Industrial).
- **Real-time Simulation:** Watch your net worth fluctuate month-by-month with dynamic graph animations.
- **Life Events:** Handle mid-year financial surprises like car trouble or tax refunds.
- **Polished UI:** A premium, dark-themed interface with smooth Framer Motion animations.

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Icons:** Lucide React
- **Build Tool:** Vite

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/capital-quest.git
   cd capital-quest
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🌐 Deployment

This project is ready to be published as a static website.

### Vercel / Netlify

1. Connect your GitHub repository to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. The platform should automatically detect the Vite configuration.
3. Use the following build settings if prompted:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### GitHub Pages

To deploy to GitHub Pages, you can use the included GitHub Action or follow these steps:

1. In `vite.config.ts`, set the `base` property to your repository name if it's not hosted at the root:
   ```typescript
   export default defineConfig({
     base: '/your-repo-name/',
     // ...
   })
   ```
2. Run `npm run build`.
3. Deploy the contents of the `dist` folder to the `gh-pages` branch.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
