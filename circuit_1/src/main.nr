fn main(a: u32, b: pub u32, c: pub u32) {
    assert(a != b);
    assert(a * b == c);
}
