import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FoodService } from './food/food.service';
import { LogService } from './log/log.service';
import { Command } from 'commander';
import chalk from 'chalk';
import { Food, Totals } from './types';

function round(n: number): string {
  return n.toFixed(1);
}

function printTotals(totals: Totals, label: string) {
  console.log(chalk.bold(`\n${label}`));
  console.log(chalk.yellow(`  Calories : ${round(totals.calories)} kcal`));
  console.log(chalk.blue(`  Protein  : ${round(totals.protein)} g`));
  console.log(chalk.green(`  Carbs    : ${round(totals.carbs)} g`));
  console.log(chalk.red(`  Fat      : ${round(totals.fat)} g`));
  console.log();
}

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const foodService = app.get(FoodService);
  const logService = app.get(LogService);

  const program = new Command();
  program.name('nutri').description('Nutrition & calorie tracker').version('1.0.0');

  // ── log commands ──────────────────────────────────────────────────────────
  const log = program.command('log').description('Manage food log');

  log
    .command('add <food> [servings]')
    .description('Log a food entry (servings default: 1)')
    .option('-d, --date <date>', 'Date in YYYY-MM-DD format (default: today)')
    .action((food: string, servings: string | undefined, opts: { date?: string }) => {
      try {
        const s = parseFloat(servings ?? '1');
        const entry = logService.addEntry(food, s, opts.date);
        const cals = round(entry.food.calories * s);
        console.log(chalk.green(`✓ Logged: ${entry.food.name} x${s} — ${cals} kcal`));
      } catch (e: any) {
        console.error(chalk.red(e.message));
        process.exit(1);
      }
    });

  log
    .command('remove <id>')
    .description('Remove a log entry by ID prefix')
    .option('-d, --date <date>', 'Date in YYYY-MM-DD format (default: today)')
    .action((id: string, opts: { date?: string }) => {
      const ok = logService.removeEntry(id, opts.date);
      console.log(ok ? chalk.green('✓ Entry removed') : chalk.red('Entry not found'));
    });

  log
    .command('list')
    .description('List today\'s log (or a specific date)')
    .option('-d, --date <date>', 'Date in YYYY-MM-DD format')
    .action((opts: { date?: string }) => {
      const entries = logService.getEntries(opts.date);
      const date = opts.date ?? new Date().toISOString().split('T')[0];
      console.log(chalk.bold(`\nLog for ${date}:`));
      if (entries.length === 0) {
        console.log(chalk.gray('  No entries yet.'));
      } else {
        entries.forEach((e) => {
          const cals = round(e.food.calories * e.servings);
          const id = e.id.substring(0, 8);
          console.log(
            `  ${chalk.gray(id)}  ${e.food.name.padEnd(25)} x${e.servings}  ${chalk.yellow(cals + ' kcal')}`,
          );
        });
      }
      console.log();
    });

  log
    .command('totals')
    .description('Show macro totals for today (or a specific date)')
    .option('-d, --date <date>', 'Date in YYYY-MM-DD format')
    .action((opts: { date?: string }) => {
      const date = opts.date ?? new Date().toISOString().split('T')[0];
      const totals = logService.getTotals(opts.date);
      printTotals(totals, `Totals for ${date}`);
    });

  // ── food commands ─────────────────────────────────────────────────────────
  const food = program.command('food').description('Manage food database');

  food
    .command('list')
    .description('List all foods in the database')
    .option('-s, --search <query>', 'Filter by name')
    .action((opts: { search?: string }) => {
      const items = opts.search
        ? foodService.search(opts.search)
        : Object.entries(foodService.list()).map(([key, f]) => ({ key, food: f }));

      console.log(chalk.bold(`\nFood database (${items.length} items):\n`));
      console.log(
        `${'Name'.padEnd(30)} ${'Serving'.padEnd(18)} ${'Cal'.padStart(6)} ${'Pro'.padStart(6)} ${'Carb'.padStart(6)} ${'Fat'.padStart(6)}`,
      );
      console.log('─'.repeat(80));
      items.forEach(({ food: f }) => {
        console.log(
          `${f.name.padEnd(30)} ${f.serving.padEnd(18)} ${String(f.calories).padStart(6)} ${String(f.protein).padStart(6)} ${String(f.carbs).padStart(6)} ${String(f.fat).padStart(6)}`,
        );
      });
      console.log(chalk.gray('\n  Units: kcal / g\n'));
    });

  food
    .command('add <name>')
    .description('Add a custom food to the database')
    .requiredOption('-c, --calories <n>', 'Calories per serving (kcal)')
    .requiredOption('-p, --protein <n>', 'Protein per serving (g)')
    .requiredOption('--carbs <n>', 'Carbs per serving (g)')
    .requiredOption('-f, --fat <n>', 'Fat per serving (g)')
    .requiredOption('-s, --serving <desc>', 'Serving description, e.g. "100g"')
    .action((name: string, opts: { calories: string; protein: string; carbs: string; fat: string; serving: string }) => {
      const f: Food = {
        name,
        calories: parseFloat(opts.calories),
        protein: parseFloat(opts.protein),
        carbs: parseFloat(opts.carbs),
        fat: parseFloat(opts.fat),
        serving: opts.serving,
      };
      foodService.add(name, f);
      console.log(chalk.green(`✓ Added "${name}" to database`));
    });

  food
    .command('remove <name>')
    .description('Remove a food from the database')
    .action((name: string) => {
      const ok = foodService.remove(name);
      console.log(ok ? chalk.green(`✓ Removed "${name}"`) : chalk.red(`Food "${name}" not found`));
    });

  food
    .command('info <name>')
    .description('Show nutrition info for a food')
    .action((name: string) => {
      const f = foodService.get(name);
      if (!f) {
        console.error(chalk.red(`Food "${name}" not found`));
        process.exit(1);
        return;
      }
      console.log(chalk.bold(`\n${f.name} (${f.serving})`));
      console.log(chalk.yellow(`  Calories : ${f.calories} kcal`));
      console.log(chalk.blue(`  Protein  : ${f.protein} g`));
      console.log(chalk.green(`  Carbs    : ${f.carbs} g`));
      console.log(chalk.red(`  Fat      : ${f.fat} g`));
      console.log();
    });

  await program.parseAsync(process.argv);
  await app.close();
}

main().catch((err) => {
  console.error(chalk.red(err.message));
  process.exit(1);
});
