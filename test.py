import subprocess
from time import sleep
import os


def test():
    sleep(5)

    # Change the working directory
    os.chdir("test")

    # Run cargo test
    subprocess.call(["cargo", "test"])


if __name__ == "__main__":
    test()
