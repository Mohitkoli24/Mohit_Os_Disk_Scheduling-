
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAX 100
#define CAP (2 * MAX + 5)

typedef struct {
    int sequence[CAP];
    int count;
    int total;
    double average;
} Result;

// Append cylinder to sequence
void add(int seq[], int *count, int value) {
    if (*count < CAP) {
        seq[(*count)++] = value;
    }
}

// Sort ascending
void sortAscending(int a[], int n) {
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (a[i] > a[j]) {
                int t = a[i];
                a[i] = a[j];
                a[j] = t;
            }
        }
    }
}

// Generate algorithm sequence
Result generate(int q[], int n, int head,
                int size, int direction, int algo) {

    Result r = {0};
    int left[MAX], right[MAX];
    int nl = 0, nr = 0;

    add(r.sequence, &r.count, head);

    // Separate requests
    for (int i = 0; i < n; i++) {
        if (q[i] < head)
            left[nl++] = q[i];
        else
            right[nr++] = q[i];
    }

    sortAscending(left, nl);
    sortAscending(right, nr);

    // FCFS
    if (algo == 1) {
        for (int i = 0; i < n; i++)
            add(r.sequence, &r.count, q[i]);
    }

    // SSTF
    else if (algo == 2) {
        int used[MAX] = {0};
        int current = head;

        for (int i = 0; i < n; i++) {
            int best = -1;
            int distance = 2147483647;

            for (int j = 0; j < n; j++) {
                int d = abs(current - q[j]);

                if (!used[j] && d < distance) {
                    distance = d;
                    best = j;
                }
            }

            used[best] = 1;
            current = q[best];
            add(r.sequence, &r.count, current);
        }
    }

    // SCAN
    else if (algo == 3) {
        if (direction == 1) {
            for (int i = 0; i < nr; i++)
                add(r.sequence, &r.count, right[i]);

            if (r.sequence[r.count - 1] != size - 1)
                add(r.sequence, &r.count, size - 1);

            for (int i = nl - 1; i >= 0; i--)
                add(r.sequence, &r.count, left[i]);
        } else {
            for (int i = nl - 1; i >= 0; i--)
                add(r.sequence, &r.count, left[i]);

            if (r.sequence[r.count - 1] != 0)
                add(r.sequence, &r.count, 0);

            for (int i = 0; i < nr; i++)
                add(r.sequence, &r.count, right[i]);
        }
    }

    // C-SCAN
    else if (algo == 4) {
        if (direction == 1) {
            for (int i = 0; i < nr; i++)
                add(r.sequence, &r.count, right[i]);

            if (r.sequence[r.count - 1] != size - 1)
                add(r.sequence, &r.count, size - 1);

            if (nl > 0) {
                add(r.sequence, &r.count, 0);

                for (int i = 0; i < nl; i++)
                    add(r.sequence, &r.count, left[i]);
            }
        } else {
            for (int i = nl - 1; i >= 0; i--)
                add(r.sequence, &r.count, left[i]);

            if (r.sequence[r.count - 1] != 0)
                add(r.sequence, &r.count, 0);

            if (nr > 0) {
                add(r.sequence, &r.count, size - 1);

                for (int i = nr - 1; i >= 0; i--)
                    add(r.sequence, &r.count, right[i]);
            }
        }
    }

    // LOOK
    else if (algo == 5) {
        if (direction == 1) {
            for (int i = 0; i < nr; i++)
                add(r.sequence, &r.count, right[i]);

            for (int i = nl - 1; i >= 0; i--)
                add(r.sequence, &r.count, left[i]);
        } else {
            for (int i = nl - 1; i >= 0; i--)
                add(r.sequence, &r.count, left[i]);

            for (int i = 0; i < nr; i++)
                add(r.sequence, &r.count, right[i]);
        }
    }

    // C-LOOK
    else if (algo == 6) {
        if (direction == 1) {
            for (int i = 0; i < nr; i++)
                add(r.sequence, &r.count, right[i]);

            for (int i = 0; i < nl; i++)
                add(r.sequence, &r.count, left[i]);
        } else {
            for (int i = nl - 1; i >= 0; i--)
                add(r.sequence, &r.count, left[i]);

            for (int i = nr - 1; i >= 0; i--)
                add(r.sequence, &r.count, right[i]);
        }
    }

    // Calculate movements
    for (int i = 1; i < r.count; i++) {
        r.total += abs(
            r.sequence[i] - r.sequence[i - 1]
        );
    }

    r.average = (double)r.total / n;

    return r;
}

// Display simulation
void display(Result r, const char *name) {
    printf("\n====================================\n");
    printf("       %s SIMULATION\n", name);
    printf("====================================\n");

    printf("\nSeek Sequence:\n");

    for (int i = 0; i < r.count; i++) {
        printf("%d", r.sequence[i]);

        if (i < r.count - 1)
            printf(" -> ");
    }

    printf("\n\nStep-by-step head movement:\n");

    for (int i = 1; i < r.count; i++) {
        int movement = abs(
            r.sequence[i] - r.sequence[i - 1]
        );

        printf("%d -> %d : %d cylinders\n",
               r.sequence[i - 1],
               r.sequence[i],
               movement);
    }

    printf("\nTotal Head Movement: %d cylinders\n", r.total);

    printf("Average Head Movement: %.2f cylinders\n",
           r.average);
}

int main() {
    int q[MAX], n, head, size, direction, choice;

    const char *names[] = {
        "", "FCFS", "SSTF", "SCAN",
        "C-SCAN", "LOOK", "C-LOOK"
    };

    printf("\n====================================\n");
    printf("      DISK SCHEDULING ANALYZER\n");
    printf("====================================\n");

    printf("\nEnter number of requests: ");
    if (scanf("%d", &n) != 1 || n < 1 || n > MAX) {
        printf("Invalid number of requests.\n");
        return 1;
    }

    printf("Enter request queue: ");

    for (int i = 0; i < n; i++) {
        if (scanf("%d", &q[i]) != 1) {
            printf("Invalid request.\n");
            return 1;
        }
    }

    printf("Enter initial head position: ");
    if (scanf("%d", &head) != 1) {
        printf("Invalid head position.\n");
        return 1;
    }

    printf("Enter disk size: ");
    if (scanf("%d", &size) != 1 || size < 2 ||
        head < 0 || head >= size) {
        printf("Invalid disk configuration.\n");
        return 1;
    }

    for (int i = 0; i < n; i++) {
        if (q[i] < 0 || q[i] >= size) {
            printf("Invalid request position.\n");
            return 1;
        }
    }

    printf("\nDirection:\n");
    printf("1. Right\n");
    printf("0. Left\n");
    printf("Enter direction: ");

    if (scanf("%d", &direction) != 1 ||
        (direction != 0 && direction != 1)) {
        printf("Invalid direction.\n");
        return 1;
    }

    printf("\nSelect Algorithm:\n");
    printf("1. FCFS\n");
    printf("2. SSTF\n");
    printf("3. SCAN\n");
    printf("4. C-SCAN\n");
    printf("5. LOOK\n");
    printf("6. C-LOOK\n");
    printf("7. Compare All\n");

    printf("\nEnter choice: ");

    if (scanf("%d", &choice) != 1 ||
        choice < 1 || choice > 7) {
        printf("Invalid choice.\n");
        return 1;
    }

    if (choice == 7) {
        int best = 1;
        int ranked_algo[7] = {0, 1, 2, 3, 4, 5, 6};
        int ranked_total[7] = {0};
        double ranked_average[7] = {0};

        printf("\n========== ALGORITHM COMPARISON ==========\n");
        printf("%-8s | %-18s | %-18s | %-18s\n",
               "Rank", "Algorithm", "Total Movement", "Average");
        printf("----------------------------------------------------------------\n");

        for (int i = 1; i <= 6; i++) {
            Result r = generate(
                q, n, head, size, direction, i
            );
            ranked_total[i] = r.total;
            ranked_average[i] = r.average;

            if (r.total < generate(
                q, n, head, size, direction, best
            ).total) {
                best = i;
            }
        }

        for (int i = 1; i <= 6; i++) {
            for (int j = i + 1; j <= 6; j++) {
                if (ranked_total[j] < ranked_total[i]) {
                    int temp_total = ranked_total[i];
                    int temp_algo = ranked_algo[i];
                    double temp_average = ranked_average[i];
                    ranked_total[i] = ranked_total[j];
                    ranked_algo[i] = ranked_algo[j];
                    ranked_average[i] = ranked_average[j];
                    ranked_total[j] = temp_total;
                    ranked_algo[j] = temp_algo;
                    ranked_average[j] = temp_average;
                }
            }
        }

        for (int rank = 1; rank <= 6; rank++) {
            int algo = ranked_algo[rank];

            printf("%-8d | %-18s | %-18d | %.2f cylinders\n",
                   rank, names[algo], ranked_total[rank],
                   ranked_average[rank]);
        }

        printf("\nBest Algorithm: %s\n", names[best]);

        Result r = generate(
            q, n, head, size, direction, best
        );

        display(r, names[best]);
    } else {
        Result r = generate(
            q, n, head, size, direction, choice
        );

        display(r, names[choice]);
    }

    printf("\nSimulation completed successfully!\n");

    return 0;
}
